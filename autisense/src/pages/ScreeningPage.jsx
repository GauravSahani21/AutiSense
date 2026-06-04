import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper, Card, Btn, Select } from '../components/UI';
import { MCHAT_QUESTIONS } from '../data/dummyData';
import { useScreening } from '../context/ScreeningContext';
import { children as childrenApi, screenings as screeningsApi, interventions as interventionsApi } from '../api';
import { predictAutism } from '../services/api';
import { normalizeCategories, mchatScoreFromAnswers } from '../utils/screeningHelpers';
import { useAuth } from '../context/AuthContext';

export default function ScreeningPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { setResult } = useScreening();
  const { isAuthenticated, user } = useAuth();

  const [step, setStep] = useState(0); // 0=pre, 1-5=questions, 6=analyzing
  const [selectedChildId, setSelectedChildId] = useState(childId || '');
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [answers, setAnswers] = useState({});
  const [apiError, setApiError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await childrenApi.getAll();
        const childrenList = res.data || [];
        setChildren(childrenList);
        
        // Auto-select child
        if (!childId && childrenList.length > 0) {
          setSelectedChildId(childrenList[0]._id);
        } else if (childId) {
          setSelectedChildId(childId);
        }
      } catch (err) {
        console.error('Failed to load children:', err);
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) fetchChildren();
  }, [isAuthenticated, childId]);

  const selectedChild = children.find(c => c._id === selectedChildId) || children[0];

  /* ── Convert answers dict to ordered 0/1 array for ML API ── */
  function buildMlAnswerArray() {
    return MCHAT_QUESTIONS.map(q => {
      const raw = answers[q.id]; // 'yes' | 'no'
      return raw === 'yes' ? 1 : 0;
    });
  }

  /* ── Convert answers dict to ordered boolean array for DB/API ── */
  function buildBooleanAnswerArray() {
    return MCHAT_QUESTIONS.map(q => answers[q.id] === 'yes');
  }

  /* ── Submit to Node API ─────────────────────── */
  async function submitScreening() {
    setAnalyzing(true);
    setApiError('');
    setStep(6);

    const booleanAnswers = buildBooleanAnswerArray();
    const answerArray = buildMlAnswerArray();

    const score = mchatScoreFromAnswers(answerArray);
    const risk  = score <= 6 ? 'Low' : score <= 13 ? 'Medium' : 'High';

    let mlResult = null;
    let offline = false;
    try {
      const childAge = selectedChild?.age ?? (
        selectedChild?.dob
          ? Math.max(1, new Date().getFullYear() - new Date(selectedChild.dob).getFullYear())
          : 3
      );
      const gender = String(selectedChild?.gender || 'male').toLowerCase().startsWith('f') ? 'f' : 'm';
      mlResult = await predictAutism(answerArray, {
        name: selectedChild?.name || 'Child',
        age: childAge,
        gender,
      });
    } catch {
      offline = true;
    }

    const probability = mlResult?.probability ?? Math.round((score / 20) * 100);
    const mlPrediction = {
      prediction: mlResult?.prediction ?? (risk !== 'Low' ? 1 : 0),
      probability,
    };

    try {
      const res = await screeningsApi.create({
        childId: selectedChildId,
        answers: booleanAnswers,
        mlPrediction,
      });

      interventionsApi.generate(selectedChildId).catch(() => {});

      const { screening, report } = res.data;
      const categories = mlResult?.categories
        ?? normalizeCategories(report?.categoryBreakdown, answerArray);

      setResult({
        child: selectedChild,
        answers: booleanAnswers,
        screened_at: screening.screeningDate || new Date().toISOString(),
        prediction: mlPrediction.prediction,
        probability,
        risk: mlResult?.risk ?? screening.riskLevel,
        score: mlResult?.score ?? screening.score,
        total: 20,
        categories,
        flagged: mlResult?.flagged?.length
          ? mlResult.flagged
          : (report.flaggedConcerns || []),
        _offline: offline,
      });
      navigate('/result');
    } catch (saveErr) {
      console.error('Failed to save screening:', saveErr);
      setApiError('Screening could not be saved. Please try again.');
      setAnalyzing(false);
      setStep(5);
    }
  }

  const handleAnswer = (qId, val) => setAnswers({ ...answers, [qId]: val });

  const currentQuestions = MCHAT_QUESTIONS.filter(q => q.step === step - 1);
  const allAnswered = currentQuestions.every(q => answers[q.id] !== undefined);

  if (loading) {
    return (
      <PageWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <p>Loading children...</p>
      </PageWrapper>
    );
  }

  /* ── NO CHILDREN EMPTY STATE ─────────────────── */
  if (children.length === 0) {
    return (
      <PageWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <Card className="animate-fadeInUp" style={{ maxWidth: 500, width: '100%', padding: '36px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>👶</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--dark)' }}>No children added yet</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 8, marginBottom: 24 }}>
            Please add a child first to start the screening process.
          </p>
          <Btn size="lg" style={{ width: '100%' }} onClick={() => navigate('/add-child')}>
            Add Child
          </Btn>
        </Card>
      </PageWrapper>
    );
  }

  /* ── PRE-SCREEN ──────────────────────────────── */
  if (step === 0) {
    return (
      <PageWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <Card className="animate-fadeInUp" style={{ maxWidth: 500, width: '100%', padding: '36px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>📝</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: 'var(--dark)' }}>M-CHAT Screening</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>Answer 20 questions to assess your child's development.</p>
          </div>

          <Select label="Select Child" value={selectedChildId} onChange={e => setSelectedChildId(e.target.value)}>
            {children.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>

          <div style={{ background: 'var(--orange-pale)', padding: 16, borderRadius: 'var(--radius-sm)', marginTop: 24, fontSize: '0.85rem', color: 'var(--dark)', border: '1px solid var(--border)' }}>
            <strong>Before you start:</strong>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Answer based on how your child <em>usually</em> behaves.</li>
              <li>If the behaviour is rare, answer "No".</li>
              <li>This test takes about 5 minutes.</li>
            </ul>
          </div>

          <Btn size="lg" style={{ width: '100%', marginTop: 28 }} onClick={() => setStep(1)} disabled={!selectedChildId}>
            Begin Screening
          </Btn>
        </Card>
      </PageWrapper>
    );
  }

  /* ── ANALYZING (step 6) ──────────────────────── */
  if (step === 6) {
    return (
      <PageWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="animate-spin" style={{ width: 48, height: 48, border: '4px solid var(--orange-pale)', borderTopColor: 'var(--orange)', borderRadius: '50%', marginBottom: 20 }} />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>Analyzing with AI...</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 8 }}>Scoring responses against clinical ML model.</p>
          {apiError && (
            <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--red)', maxWidth: 320 }}>
              ⚠️ {apiError} — using offline scoring as fallback.
            </p>
          )}
        </div>
      </PageWrapper>
    );
  }

  /* ── QUESTIONS ───────────────────────────────── */
  return (
    <PageWrapper style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Progress header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem' }}>Step {step} of 5</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(s => (
                <div key={s} style={{ position: 'relative', width: 10, height: 10 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: s < step ? 'var(--orange)' : s === step ? 'var(--orange)' : 'var(--border)' }} />
                  {s === step && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid var(--orange)', animation: 'pulse-dot 1.5s infinite' }} />}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--orange-pale)', borderRadius: 3 }}>
            <div style={{ width: `${(step / 5) * 100}%`, height: '100%', background: 'var(--orange)', borderRadius: 3, transition: 'width 0.3s ease' }} />
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 440 }}>
          {currentQuestions.map((q, i) => (
            <Card key={q.id} className={`animate-slideRight delay-${i+1}`} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: '1.8rem' }}>{q.emoji}</div>
              <div style={{ flex: 1, fontSize: '0.95rem', fontWeight: 600 }}>{q.text}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleAnswer(q.id, 'yes')}
                  style={{
                    padding: '8px 24px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: answers[q.id] === 'yes' ? 'var(--green)' : 'var(--cream)',
                    color: answers[q.id] === 'yes' ? 'white' : 'var(--dark)',
                    border: `1.5px solid ${answers[q.id] === 'yes' ? 'var(--green)' : 'var(--border)'}`,
                  }}
                >Yes</button>
                <button
                  onClick={() => handleAnswer(q.id, 'no')}
                  style={{
                    padding: '8px 24px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: answers[q.id] === 'no' ? 'var(--red)' : 'var(--cream)',
                    color: answers[q.id] === 'no' ? 'white' : 'var(--dark)',
                    border: `1.5px solid ${answers[q.id] === 'no' ? 'var(--red)' : 'var(--border)'}`,
                  }}
                >No</button>
              </div>
            </Card>
          ))}
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          <Btn variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Btn>
          {step < 5 ? (
            <Btn onClick={() => setStep(s => s + 1)} disabled={!allAnswered}>Next →</Btn>
          ) : (
            <Btn onClick={submitScreening} disabled={!allAnswered || analyzing}>
              {analyzing ? 'Submitting…' : 'Submit & Analyze 🧠'}
            </Btn>
          )}
        </div>
        {apiError && (
          <p style={{ marginTop: 14, fontSize: '0.85rem', color: 'var(--red)', fontWeight: 600 }}>
            {apiError}
          </p>
        )}
      </div>
    </PageWrapper>
  );
}
