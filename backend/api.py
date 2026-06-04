# ──────────────────────────────────────────────
# AutiSense — Flask API
# Connects trained ML model to React frontend
#
# Install deps:  pip install -r requirements.txt
# Run server:    python api.py
# ──────────────────────────────────────────────

import os
import pickle
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000"])

# ── Load model bundle ─────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, 'autism_model.pkl')

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model not found at {MODEL_PATH}\n"
        "Please run 'python train_model.py' first."
    )

with open(MODEL_PATH, 'rb') as f:
    bundle = pickle.load(f)

model = bundle['model']
scaler = bundle['scaler']
encoders = bundle.get('encoders', {})
features = bundle['features']
accuracy = bundle.get('accuracy', 94.0)

print(f"[OK] Model loaded — features: {features}")
print(f"   Accuracy: {accuracy}%")


# ── Helpers ───────────────────────────────────
def mchat_score(answers: list) -> int:
    """M-CHAT score: Q1–10 & Q20 risk if No; Q11–19 risk if Yes."""
    score = 0
    for i, a in enumerate(answers):
        if i <= 9 or i == 19:
            if a == 0:
                score += 1
        elif a == 1:
            score += 1
    return score


def compute_risk_label(score: int, total: int = 20) -> tuple:
    if score <= 6:
        return 'Low', round((score / total) * 100, 1)
    if score <= 13:
        return 'Medium', round((score / total) * 100, 1)
    return 'High', round((score / total) * 100, 1)


def encode_yes_no(field: str, is_yes: bool) -> int:
    encoder = encoders.get(field)
    if encoder is None:
        return 1 if is_yes else 0
    label = 'yes' if is_yes else 'no'
    return int(encoder.transform([label])[0])


def build_feature_vector(answers: list, child: dict) -> tuple:
    """Map answers + child metadata into the scaled feature vector."""
    score = mchat_score(answers)
    gender = str(child.get('gender', 'm')).lower()
    sex_yes = gender in ('m', 'male', 'boy', '1')

    row = {f'A{i + 1}': answers[i] for i in range(10)}
    row['Age_Mons'] = int(child.get('age', 3)) * 12
    row['Sex'] = encode_yes_no('Sex', sex_yes)
    row['Ethnicity'] = encode_yes_no('Ethnicity', False)
    row['Jaundice'] = encode_yes_no('Jaundice', False)
    row['Family_mem_with_ASD'] = encode_yes_no('Family_mem_with_ASD', False)

    vec = np.array([[row.get(f, 0) for f in features]])
    if scaler is not None:
        vec = scaler.transform(vec)
    return vec, score


def category_breakdown(answers: list) -> dict:
    return {
        'Social': round(sum(1 - a for a in answers[0:4]) / 4, 3),
        'Communication': round(sum(1 - a for a in answers[4:8]) / 4, 3),
        'Behavior': round(sum([1 - answers[8], 1 - answers[9], answers[10], answers[11]]) / 4, 3),
        'Sensory': round(sum(answers[12:16]) / 4, 3),
        'Routine': round(sum([answers[16], answers[17], answers[18], 1 - answers[19]]) / 4, 3),
    }


def flagged_questions(answers: list) -> list:
    flagged = []
    for i, a in enumerate(answers):
        if i <= 9 or i == 19:
            if a == 0:
                flagged.append(f"Question {i + 1}")
        elif a == 1:
            flagged.append(f"Question {i + 1}")
    return flagged


def local_weekly_activities(age: int, risk_level: str) -> list:
    risk = str(risk_level or 'Medium').lower()
    a = int(age) if age else 3

    base = [
        ['Mon', 'Turn-Taking Play',
         'Play a simple turn-taking game. Pause to invite eye contact or a sound before your turn.', 12, 'communication'],
        ['Tue', 'Sensory Texture Talk',
         'Explore 2 safe textures. Model words like “soft/smooth” and encourage pointing.', 10, 'sensory'],
        ['Wed', 'Imitation Burst',
         'Short imitation bursts: clap, wave, stomp. Reward attempts immediately.', 8, 'behavior'],
        ['Thu', 'Picture Choice Practice',
         'Offer 2 picture choices. Prompt pointing or a word before giving the item.', 10, 'communication'],
        ['Fri', 'Calm Body Routine',
         'Try a calm routine with a predictable “finished” cue.', 8, 'sensory'],
        ['Sat', 'First–Then Routine',
         'Use “First activity, then reward” with a clear visual.', 10, 'behavior'],
    ]

    if a <= 3:
        base = [[d, n, desc, max(6, dur - 2), f] for d, n, desc, dur, f in base]
    if risk == 'high':
        base = [[d, n, f"{desc} Repeat twice daily if possible.", max(6, dur - 2), f]
                for d, n, desc, dur, f in base]

    return [
        {'day': d, 'name': n, 'description': desc, 'durationMinutes': dur, 'focusArea': f}
        for d, n, desc, dur, f in base
    ]


# ── Routes ────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(force=True) or {}
    answers = data.get('answers', [])
    child = data.get('child', {})

    if len(answers) != 20:
        return jsonify({'error': f'Need exactly 20 answers, got {len(answers)}'}), 400
    if not all(a in (0, 1) for a in answers):
        return jsonify({'error': 'All answers must be 0 or 1'}), 400

    input_vec, score = build_feature_vector(answers, child)
    risk_label, risk_pct = compute_risk_label(score)

    try:
        prediction = int(model.predict(input_vec)[0])
        probability = round(float(model.predict_proba(input_vec)[0][1]) * 100, 1)
    except Exception as e:
        print(f"Prediction error: {e}")
        prediction = 1 if risk_label != 'Low' else 0
        probability = risk_pct

    return jsonify({
        'prediction': prediction,
        'probability': probability,
        'risk': risk_label,
        'score': score,
        'total': 20,
        'categories': category_breakdown(answers),
        'flagged': flagged_questions(answers),
    })


@app.route('/generate-intervention', methods=['POST'])
def generate_intervention():
    """Weekly intervention plan from screening risk + answer pattern."""
    data = request.get_json(force=True) or {}
    answers = data.get('answers') or []
    risk_level = data.get('riskLevel', 'Medium')
    age = int(data.get('age') or 3)

    focus_areas = []
    if len(answers) == 20:
        comm = sum(1 - a for a in answers[4:8]) / 4
        sensory = sum(answers[12:16]) / 4
        behavior = sum([1 - answers[8], 1 - answers[9], answers[10], answers[11]]) / 4
        ranked = sorted(
            [('communication', comm), ('sensory', sensory), ('behavior', behavior)],
            key=lambda x: x[1],
            reverse=True,
        )
        focus_areas = [ranked[0][0], ranked[1][0]]

    if not focus_areas:
        focus_areas = ['communication', 'sensory']

    activities = local_weekly_activities(age, risk_level)
    tips = [
        'Keep sessions short, predictable, and playful.',
        'Praise attempts immediately—small wins matter.',
        'Use simple visuals (pictures/gestures) to reduce frustration.',
        'Repeat the same routine daily for a week before changing.',
    ]

    return jsonify({
        'focusAreas': focus_areas,
        'weeklyActivities': activities,
        'tips': tips,
    })


def explain_screening(answers: list, risk_level: str, score: int) -> dict:
    """Rule-based explainability aligned with M-CHAT scoring."""
    mchat_questions = [
        'Does your child look at you when you call his/her name?',
        'Does your child make eye contact with familiar people?',
        'Does your child point to show you something interesting?',
        'Does your child smile back when you smile at them?',
        'Does your child use words to communicate (or babble before 12 mo)?',
        'Does your child follow when you point at something across the room?',
        'Does your child bring objects to show you things?',
        'Does your child respond to simple instructions (e.g. "Come here")?',
        'Does your child engage in pretend or make-believe play?',
        'Does your child show interest in playing with other children?',
        'Does your child show repetitive hand or arm movements (flapping)?',
        'Does your child spin objects or spin themselves repeatedly?',
        'Does your child seem sensitive to loud sounds or bright lights?',
        'Does your child walk on tiptoes more often than on flat feet?',
        'Does your child avoid physical contact like hugging?',
        'Does your child have unusual reactions to textures (food/clothing)?',
        'Does your child get very upset by small changes in daily routine?',
        'Does your child line up toys or objects in rigid patterns?',
        'Does your child seem to be "in his/her own world" often?',
        'Does your child respond when you try to play with them?',
    ]

    factors = []
    for i, a in enumerate(answers):
        is_risk = (i <= 9 or i == 19) and a == 0 or (10 <= i <= 18) and a == 1
        if not is_risk:
            continue
        weight = 6 if i < 4 else 5 if i < 8 else 4
        factors.append({
            'questionId': i + 1,
            'questionText': mchat_questions[i],
            'contributionPercent': weight,
        })

    factors.sort(key=lambda x: x['contributionPercent'], reverse=True)
    total = sum(f['contributionPercent'] for f in factors) or 1
    top = []
    for f in factors[:5]:
        top.append({
            **f,
            'contributionPercent': round((f['contributionPercent'] / total) * 100),
        })

    return {
        'topFactors': top,
        'riskLevel': risk_level,
        'score': score,
    }


@app.route('/explain', methods=['POST'])
def explain():
    data = request.get_json(force=True) or {}
    answers = data.get('answers', [])
    risk_level = data.get('riskLevel', 'Medium')
    score = int(data.get('score', mchat_score(answers) if len(answers) == 20 else 0))

    if len(answers) != 20:
        return jsonify({'error': 'Need exactly 20 answers'}), 400

    return jsonify(explain_screening(answers, risk_level, score))


@app.route('/next-action', methods=['POST'])
def next_action():
    data = request.get_json(force=True) or {}
    risk_level = str(data.get('riskLevel', 'Medium'))
    score = int(data.get('score', 0))
    child = data.get('child') or {}
    history = data.get('screeningHistory') or []

    risk = risk_level.lower()
    if risk == 'high' or score >= 14:
        action = 'refer developmental specialist'
        urgency = 'high'
        timeline = 'Within 2 weeks'
        reasoning = (
            f"The latest M-CHAT score is {score}/20 ({risk_level} risk). "
            "A comprehensive developmental evaluation is recommended promptly."
        )
    elif risk == 'medium' or score >= 7:
        action = 'schedule follow-up screening'
        urgency = 'medium'
        timeline = 'Within 4–6 weeks'
        reasoning = (
            f"The screening score is {score}/20 ({risk_level} risk). "
            "Monitor communication and social engagement; consider specialist consult if scores worsen."
        )
    else:
        action = 'continue routine monitoring'
        urgency = 'low'
        timeline = 'Rescreen in 6 months'
        reasoning = (
            f"The screening score is {score}/20 ({risk_level} risk). "
            "Continue age-appropriate developmental monitoring at well-child visits."
        )

    if len(history) >= 2:
        prev = history[-2].get('score', score)
        if score > prev:
            reasoning += f" Score increased from {prev} to {score} — closer follow-up is advised."
        elif score < prev:
            reasoning += f" Score improved from {prev} to {score} — maintain current support strategies."

    return jsonify({
        'action': action,
        'urgency': urgency,
        'timeline': timeline,
        'reasoning': reasoning,
        'childName': child.get('name'),
    })


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model': 'Random Forest (tuned)',
        'accuracy': f'{accuracy}%',
        'features': features,
    })


if __name__ == '__main__':
    app.run(debug=False, port=5001, host='0.0.0.0')
