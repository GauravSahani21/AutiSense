import React, { useEffect, useMemo, useState } from 'react';
import { interventions as interventionsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, Btn, Badge, useToast } from '../components/UI';

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function focusLabel(f) {
  if (f === 'communication') return 'Communication';
  if (f === 'sensory') return 'Sensory';
  if (f === 'behavior') return 'Behavior';
  return f;
}

function focusColor(f) {
  if (f === 'communication') return 'var(--orange)';
  if (f === 'sensory') return '#2563eb';
  if (f === 'behavior') return 'var(--green)';
  return 'var(--mid)';
}

function ProgressRing({ percent = 0 }) {
  const p = clamp(Number(percent) || 0, 0, 100);
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="var(--orange)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 28 28)"
        />
        <text x="28" y="32" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--dark)">
          {p}%
        </text>
      </svg>
      <div>
        <div style={{ fontWeight: 900, color: 'var(--dark)' }}>Adherence</div>
        <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>This week</div>
      </div>
    </div>
  );
}

export default function InterventionPlan({ childId }) {
  const { isAuthenticated, user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyGenerate, setBusyGenerate] = useState(false);
  const [busySave, setBusySave] = useState(false);
  const [tips, setTips] = useState([]);

  const latestPlan = plans[0] || null;

  const focusBreakdown = useMemo(() => {
    const acts = latestPlan?.activities || [];
    const total = acts.length || 1;
    const counts = { communication: 0, sensory: 0, behavior: 0 };
    for (const a of acts) {
      if (counts[a.focusArea] !== undefined) counts[a.focusArea] += 1;
    }
    return {
      communication: Math.round((counts.communication / total) * 100),
      sensory: Math.round((counts.sensory / total) * 100),
      behavior: Math.round((counts.behavior / total) * 100),
    };
  }, [latestPlan]);

  const fetchPlans = async () => {
    if (!isAuthenticated || !childId) return;
    try {
      setLoading(true);
      const res = await interventionsApi.getByChild(childId);
      setPlans(res.data || []);
      setTips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [isAuthenticated, childId]);

  const handleGenerate = async () => {
    if (!isAuthenticated || !childId) return;
    try {
      setBusyGenerate(true);
      const res = await interventionsApi.generate(childId);
      const created = res.data;
      setTips(created?.tips || []);
      // Prepend created plan to list without refetch
      setPlans((prev) => [created, ...prev]);
      showToast(`Generated Week ${created?.weekNumber || ''} plan.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to generate plan', 'error');
    } finally {
      setBusyGenerate(false);
    }
  };

  const toggleDone = (index) => {
    if (!latestPlan) return;
    const updated = {
      ...latestPlan,
      activities: latestPlan.activities.map((a, i) => (i === index ? { ...a, done: !a.done } : a))
    };
    setPlans((prev) => [updated, ...prev.slice(1)]);
  };

  const saveAdherence = async () => {
    if (!isAuthenticated || !latestPlan) return;
    try {
      setBusySave(true);
      const patches = latestPlan.activities.map((a, idx) => ({ index: idx, done: !!a.done }));
      const res = await interventionsApi.updateAdherence(latestPlan._id, patches, latestPlan.outcomeNotes || '');
      setPlans((prev) => [res.data, ...prev.slice(1)]);
      showToast('Saved progress.', 'success');
    } finally {
      setBusySave(false);
    }
  };

  if (loading) {
    return (
      <Card style={{ padding: 22 }}>
        <div style={{ color: 'var(--muted)' }}>Loading intervention plans...</div>
      </Card>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {ToastComponent}
      <Card style={{ padding: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--dark)' }}>
            Personalized Intervention Plan
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4 }}>
            {latestPlan ? `Week ${latestPlan.weekNumber} • ${new Date(latestPlan.createdAt).toLocaleDateString()}` : 'No plan yet'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ProgressRing percent={latestPlan?.adherenceScore ?? 0} />
          <Btn onClick={handleGenerate} disabled={busyGenerate}>
            {busyGenerate ? 'Generating…' : 'Generate New Plan'}
          </Btn>
        </div>
      </Card>

      {latestPlan && (
        <Card style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ fontWeight: 900, color: 'var(--dark)' }}>Focus areas</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(latestPlan.focusAreas || []).map((f) => (
                <span
                  key={f}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 999,
                    background: 'var(--cream)',
                    border: '1px solid var(--border)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    color: 'var(--dark)'
                  }}
                >
                  {focusLabel(f)}
                </span>
              ))}
            </div>
          </div>

          <div className="grid-3" style={{ gap: 12 }}>
            {(['communication', 'sensory', 'behavior']).map((f) => (
              <div key={f} style={{ background: 'var(--cream)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 900, color: 'var(--dark)' }}>{focusLabel(f)}</div>
                <div style={{ marginTop: 8, height: 6, background: 'var(--border)', borderRadius: 999 }}>
                  <div style={{ width: `${focusBreakdown[f]}%`, height: '100%', borderRadius: 999, background: focusColor(f) }} />
                </div>
                <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 800 }}>
                  {focusBreakdown[f]}% of activities
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!latestPlan ? (
        <Card style={{ padding: 22 }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            No intervention plan yet. Click <strong>Generate New Plan</strong>.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(latestPlan.activities || []).map((a, idx) => (
            <Card key={`${a.day}-${idx}`} style={{ padding: 18, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <input
                type="checkbox"
                checked={!!a.done}
                onChange={() => toggleDone(idx)}
                style={{ marginTop: 4, width: 18, height: 18 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 900, color: 'var(--dark)' }}>
                    {a.day}: {a.name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--mid)' }}>
                      {a.durationMinutes} min
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: 'var(--orange-pale)',
                        color: 'var(--orange-deep)',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {focusLabel(a.focusArea)}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 6, fontSize: '0.88rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {a.description}
                </div>
              </div>
            </Card>
          ))}

          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 900, color: 'var(--dark)', marginBottom: 10 }}>Parent tips</div>
            <ul style={{ paddingLeft: 18, margin: 0, color: 'var(--mid)', fontSize: '0.88rem', lineHeight: 1.7 }}>
              {(tips.length ? tips : ['Keep sessions short and fun.', 'Repeat routines daily.', 'Praise attempts and small wins.']).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="outline" onClick={fetchPlans}>
              Refresh
            </Btn>
            <Btn onClick={saveAdherence} disabled={busySave}>
              {busySave ? 'Saving…' : 'Save Progress'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

