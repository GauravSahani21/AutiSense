import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageWrapper, Card, Badge, Btn, BackBtn, Input, useToast } from '../components/UI';
import { children as childrenApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ChildDetailPage() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { showToast, ToastComponent } = useToast();
  const isEditMode = location.pathname.endsWith('/edit');

  const [tab, setTab] = useState(location.state?.tab || (isEditMode ? 'details' : 'overview'));
  const [child, setChild] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', dob: '', gender: 'male', guardian: '' });

  useEffect(() => {
    const fetchChildDetails = async () => {
      if (!isAuthenticated || !childId) return;

      setLoading(true);
      setError('');
      setChild(null);
      setHistory([]);

      try {
        const [childRes, screeningsRes] = await Promise.all([
          childrenApi.getOne(childId),
          childrenApi.getScreenings(childId),
        ]);

        const fetchedChild = childRes?.data || null;
        const fetchedHistory = (screeningsRes?.data || []).sort(
          (a, b) => new Date(b.screeningDate || b.createdAt) - new Date(a.screeningDate || a.createdAt)
        );

        setChild(fetchedChild);
        setHistory(fetchedHistory);

        if (fetchedChild) {
          const dobStr = fetchedChild.dob
            ? new Date(fetchedChild.dob).toISOString().slice(0, 10)
            : '';
          setForm({
            name: fetchedChild.name || '',
            dob: dobStr,
            gender: fetchedChild.gender || 'male',
            guardian: fetchedChild.guardian || '',
          });
        }
      } catch (err) {
        setError(err?.message || 'Failed to fetch child details');
      } finally {
        setLoading(false);
      }
    };

    fetchChildDetails();
  }, [childId, isAuthenticated]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dob || !form.guardian.trim()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await childrenApi.update(childId, form);
      setChild(res.data);
      showToast('Child profile updated.', 'success');
      navigate(`/parent/child/${childId}/details`);
    } catch (err) {
      showToast(err?.message || 'Failed to update child', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper style={{ padding: '40px 24px' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <BackBtn onClick={() => navigate('/parent')} label="Back to Dashboard" />
          <Card style={{ padding: 28, textAlign: 'center' }}>Loading child details...</Card>
        </div>
      </PageWrapper>
    );
  }

  if (error || !child) {
    return (
      <PageWrapper style={{ padding: '40px 24px' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <BackBtn onClick={() => navigate('/parent')} label="Back to Dashboard" />
          <Card style={{ padding: 28, textAlign: 'center', color: 'var(--red)' }}>
            {error || 'Child not found'}
          </Card>
        </div>
      </PageWrapper>
    );
  }

  const computedAge = child.age ?? (child.dob ? new Date().getFullYear() - new Date(child.dob).getFullYear() : '--');
  const displayGender = child.gender ? child.gender.charAt(0).toUpperCase() + child.gender.slice(1) : '--';

  if (isEditMode) {
    return (
      <PageWrapper style={{ padding: '40px 24px' }}>
        {ToastComponent}
        <div className="container" style={{ maxWidth: 560 }}>
          <BackBtn onClick={() => navigate(`/parent/child/${childId}/details`)} label="Cancel" />
          <Card style={{ padding: 32, marginTop: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', marginBottom: 24 }}>
              Edit Child Profile
            </h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Date of Birth" type="date" name="dob" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} required />
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <Input label="Guardian Name" name="guardian" value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} required />
              <Btn type="submit" size="lg" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
            </form>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper style={{ padding: '40px 24px' }}>
      {ToastComponent}
      <div className="container" style={{ maxWidth: 860 }}>
        <BackBtn onClick={() => navigate('/parent')} label="Back to Dashboard" />

        <Card className="animate-fadeInUp" style={{ padding: 32, marginBottom: 28, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
            {(!child.avatar || child.avatar === 'default-avatar') ? '👶' : child.avatar}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.8rem', color: 'var(--dark)' }}>{child.name}</h1>
                <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginTop: 4 }}>
                  {computedAge} yrs • {displayGender} • Guardian: {child.guardian}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Badge risk={child.risk || 'Low'} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--mid)', fontWeight: 600 }}>Score: {child.score || 0}/{child.total || 20}</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Screening History</button>
          <button className={`tab-btn ${tab === 'details' ? 'active' : ''}`} onClick={() => setTab('details')}>Details</button>
        </div>

        <div className="animate-fadeIn">
          {tab === 'overview' && (
            <div className="grid-2">
              <Card style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 20 }}>Current Snapshot</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--dark)', lineHeight: 1.8 }}>
                  <div><strong>Latest score:</strong> {child.score || 0} / {child.total || 20}</div>
                  <div><strong>Latest risk:</strong> {child.risk || 'Low'}</div>
                  <div><strong>Last screened:</strong> {child.lastScreen ? new Date(child.lastScreen).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Total screenings:</strong> {history.length}</div>
                </div>
              </Card>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Card style={{ padding: 24, flex: 1 }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 16 }}>Recent Trend</h3>
                  {history.length > 0 ? (
                    <div style={{ fontSize: '0.88rem', color: 'var(--dark)', lineHeight: 1.8 }}>
                      <div>Most recent score: <strong>{history[0].score}</strong></div>
                      {history[1] && <div>Previous score: <strong>{history[1].score}</strong></div>}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.88rem', color: 'var(--muted)' }}>No screenings yet.</div>
                  )}
                </Card>
                <Btn size="lg" onClick={() => navigate(`/visual-screening?childId=${child._id}`)}>Start AI Assessment</Btn>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <Card className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Risk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h._id}>
                      <td style={{ fontWeight: 600 }}>{new Date(h.screeningDate || h.createdAt).toLocaleDateString()}</td>
                      <td>{h.score} / 20</td>
                      <td><Badge risk={h.riskLevel} /></td>
                      <td style={{ textTransform: 'capitalize' }}>{h.status || 'completed'}</td>
                    </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>No history found.</td></tr>}
                </tbody>
              </table>
            </Card>
          )}

          {tab === 'details' && (
            <Card style={{ padding: 28 }}>
              <div className="grid-2">
                <div>
                  <div className="form-group"><label className="form-label">Full Name</label><div style={{ fontWeight: 600 }}>{child.name}</div></div>
                  <div className="form-group"><label className="form-label">Date of Birth</label><div style={{ fontWeight: 600 }}>{child.dob ? new Date(child.dob).toLocaleDateString() : 'N/A'}</div></div>
                  <div className="form-group"><label className="form-label">Gender</label><div style={{ fontWeight: 600 }}>{displayGender}</div></div>
                </div>
                <div>
                  <div className="form-group"><label className="form-label">Guardian Name</label><div style={{ fontWeight: 600 }}>{child.guardian}</div></div>
                  <div className="form-group"><label className="form-label">Total Screenings</label><div style={{ fontWeight: 600 }}>{history.length}</div></div>
                  <div className="form-group"><label className="form-label">Last Screened</label><div style={{ fontWeight: 600 }}>{child.lastScreen ? new Date(child.lastScreen).toLocaleDateString() : 'N/A'}</div></div>
                </div>
              </div>
              <div className="divider" />
              <Btn variant="outline" onClick={() => navigate(`/parent/child/${child._id}/edit`)}>Edit Details</Btn>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
