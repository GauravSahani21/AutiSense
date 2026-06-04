import Child from '../models/Child.js';
import Screening from '../models/Screening.js';

const ML_BASE_URL = process.env.ML_API_URL || 'http://localhost:5001';

async function callMl(endpoint, payload) {
  const res = await fetch(`${ML_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `ML API error (${res.status})`);
  return data;
}

function localNextAction({ child, latest, history }) {
  const risk = String(latest.riskLevel || 'Medium').toLowerCase();
  const score = latest.score ?? 0;

  let action = 'continue routine monitoring';
  let urgency = 'low';
  let timeline = 'Rescreen in 6 months';
  let reasoning = `Latest M-CHAT score is ${score}/20 (${latest.riskLevel} risk).`;

  if (risk === 'high' || score >= 14) {
    action = 'refer developmental specialist';
    urgency = 'high';
    timeline = 'Within 2 weeks';
    reasoning += ' Prompt specialist evaluation is recommended.';
  } else if (risk === 'medium' || score >= 7) {
    action = 'schedule follow-up screening';
    urgency = 'medium';
    timeline = 'Within 4–6 weeks';
    reasoning += ' Monitor closely and re-screen on this timeline.';
  }

  if (history.length >= 2) {
    const prev = history[history.length - 2]?.score ?? score;
    if (score > prev) reasoning += ` Score rose from ${prev} to ${score}.`;
    else if (score < prev) reasoning += ` Score improved from ${prev} to ${score}.`;
  }

  return { action, urgency, timeline, reasoning, childName: child?.name };
}

function localExplainability(ordered, screening) {
  const mchatQuestions = ordered.map((a) => a.questionText);
  const factors = [];

  ordered.forEach((a, i) => {
    const ans = a.answer ? 1 : 0;
    const isRisk = (i <= 9 || i === 19) ? ans === 0 : ans === 1;
    if (!isRisk) return;
    const weight = i < 4 ? 6 : i < 8 ? 5 : 4;
    factors.push({
      questionId: a.questionId,
      questionText: mchatQuestions[i] || a.questionText,
      contributionPercent: weight,
    });
  });

  factors.sort((a, b) => b.contributionPercent - a.contributionPercent);
  const total = factors.reduce((s, f) => s + f.contributionPercent, 0) || 1;
  const topFactors = factors.slice(0, 5).map((f) => ({
    ...f,
    contributionPercent: Math.round((f.contributionPercent / total) * 100),
  }));

  return {
    topFactors,
    riskLevel: screening.riskLevel,
    score: screening.score,
    screeningDate: screening.screeningDate,
  };
}

// @desc    AI generated next best action for a child
// @route   GET /api/clinical/next-action/:childId
// @access  Private (doctor)
export const getNextBestAction = async (req, res, next) => {
  try {
    const { childId } = req.params;

    const child = await Child.findById(childId).select('name dob gender');
    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    const screenings = await Screening.find({ childId })
      .sort({ screeningDate: -1 })
      .select('screeningDate score riskLevel status');

    if (!screenings.length) {
      return res.status(400).json({ success: false, error: 'No screenings found for this child' });
    }

    const latest = screenings[0];
    const history = screenings
      .slice(0, 8)
      .map((s) => ({
        date: s.screeningDate,
        score: s.score,
        riskLevel: s.riskLevel,
        status: s.status
      }))
      .reverse();

    const age =
      child.age ??
      (child.dob ? Math.max(1, new Date().getFullYear() - new Date(child.dob).getFullYear()) : 3);
    const gender = String(child.gender || 'male').toLowerCase().startsWith('f') ? 'f' : 'm';

    let data;
    try {
      data = await callMl('/next-action', {
        childId: String(child._id),
        child: { name: child.name, age, gender },
        riskLevel: latest.riskLevel,
        score: latest.score,
        screeningHistory: history
      });
    } catch {
      data = localNextAction({ child, latest, history });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @desc    Explainability for a screening (top contributing questions)
// @route   GET /api/clinical/explainability/:screeningId
// @access  Private (doctor)
export const getExplainability = async (req, res, next) => {
  try {
    const { screeningId } = req.params;

    const screening = await Screening.findById(screeningId).select(
      'answers riskLevel score screeningDate'
    );
    if (!screening) {
      return res.status(404).json({ success: false, error: 'Screening not found' });
    }

    const ordered = (screening.answers || [])
      .slice()
      .sort((a, b) => Number(a.questionId) - Number(b.questionId));
    const answers01 = ordered.map((a) => (a?.answer ? 1 : 0));

    let ml;
    try {
      ml = await callMl('/explain', {
        answers: answers01,
        riskLevel: screening.riskLevel,
        score: screening.score
      });
    } catch {
      ml = localExplainability(ordered, screening);
    }

    res.status(200).json({
      success: true,
      data: {
        screeningId,
        ...ml
      }
    });
  } catch (err) {
    next(err);
  }
};
