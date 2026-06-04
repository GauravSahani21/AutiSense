import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { children as childrenApi, screenings as screeningsApi, trajectory as trajectoryApi } from '../api';
import { Container, PageWrapper, SectionHeading, StatCard, Card, Btn, Badge, ScoreBar, Modal, useToast, EmptyState, Grid } from '../components/UI';
import InterventionPlan from './InterventionPlan';

export default function ParentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [tab, setTab] = useState('children'); // children | interventions
  const [selectedChildForIntervention, setSelectedChildForIntervention] = useState('');

  const [children, setChildren] = useState([]);
  const [allScreenings, setAllScreenings] = useState([]);
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [expandedChildId, setExpandedChildId] = useState(null);
  const [trajectoryByChild, setTrajectoryByChild] = useState({});
  const [loadingTrajectoryByChild, setLoadingTrajectoryByChild] = useState({});
  const [trajectoryErrorByChild, setTrajectoryErrorByChild] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      try {
        const [childrenRes, screeningsRes] = await Promise.all([
          childrenApi.getAll(),
          screeningsApi.getAll(),
        ]);

        const loadedChildren = childrenRes.data || [];
        const loadedScreenings = screeningsRes.data || [];

        setChildren(loadedChildren);
        setAllScreenings(loadedScreenings);

        if (!selectedChildForIntervention && loadedChildren.length > 0) {
          setSelectedChildForIntervention(loadedChildren[0]._id);
        }
        const sortedRecent = [...loadedScreenings]
          .sort((a, b) => new Date(b.screeningDate || b.createdAt) - new Date(a.screeningDate || a.createdAt))
          .slice(0, 5)
          .map((row) => ({
            _id: row._id,
            date: row.screeningDate || row.createdAt,
            childId: row.childId?._id || row.childId,
            childName: row.childId?.name || 'Unknown Child',
            score: row.score || 0,
            total: 20,
            risk: row.riskLevel || 'Low',
            status: row.status || 'completed'
          }));
        setRecentScreenings(sortedRecent);
      } catch (err) {
        showToast('Failed to load dashboard data', 'error');
      }
    };
    fetchDashboardData();
  }, [isAuthenticated]);

  const confirmDelete = async () => {
    try {
      await childrenApi.remove(deleteModal._id);
      setChildren(c => c.filter(x => x._id !== deleteModal._id));
      showToast(`${deleteModal.name} removed successfully.`, 'success');
      setDeleteModal(null);
    } catch (err) {
      showToast('Failed to remove child', 'error');
    }
  };

  const toggleTrajectory = async (childId) => {
    if (expandedChildId === childId) {
      setExpandedChildId(null);
      return;
    }

    setExpandedChildId(childId);
    setTrajectoryErrorByChild((prev) => ({ ...prev, [childId]: '' }));
    if (trajectoryByChild[childId]) return;

    try {
      setLoadingTrajectoryByChild((prev) => ({ ...prev, [childId]: true }));
      const res = await trajectoryApi.getTrajectory(childId);
      setTrajectoryByChild((prev) => ({ ...prev, [childId]: res.data }));
    } catch (err) {
      const message = err?.message || 'Failed to load risk trajectory';
      setTrajectoryErrorByChild((prev) => ({ ...prev, [childId]: message }));
      showToast(message, 'error');
    } finally {
      setLoadingTrajectoryByChild((prev) => ({ ...prev, [childId]: false }));
    }
  };

  const highRiskCount = allScreenings.filter(s => s.riskLevel === 'High').length;
  const latestScreening = [...allScreenings]
    .sort((a, b) => new Date(b.screeningDate || b.createdAt) - new Date(a.screeningDate || a.createdAt))[0];
  const lastScreening = latestScreening
    ? new Date(latestScreening.screeningDate || latestScreening.createdAt).toLocaleDateString()
    : '--';

  return (
    <PageWrapper>
      {ToastComponent}
      
      {/* Confirm Delete Modal */}
      <Modal open={!!deleteModal} onClose={() => setDeleteModal(null)} title="Remove Child Profile">
        <p style={{ fontSize: '1rem', color: 'var(--dark)', marginBottom: 28, lineHeight: 1.6 }}>
          Are you sure you want to remove <strong>{deleteModal?.name}</strong>? This action cannot be undone and will delete their screening history.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setDeleteModal(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={confirmDelete}>Remove Child</Btn>
        </div>
      </Modal>

      <Container style={{ padding: '60px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.8rem', color: 'var(--dark)', letterSpacing: '-0.02em' }}>
            Hello, {user?.name?.split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>
              Welcome back to your dashboard. Today is {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Btn onClick={() => navigate('/add-child')} icon={<span style={{ fontSize: '1.2rem' }}>+</span>}>Add Child</Btn>
        </div>

        {/* Stats */}
        <Grid cols={4} style={{ marginBottom: 64 }}>
          <StatCard icon="👶" value={children.length} label="Children Tracked" bg="var(--orange-pale)" color="var(--orange-deep)" />
          <StatCard icon="📋" value={allScreenings.length} label="Total Screenings" bg="#eff6ff" color="#2563eb" />
          <StatCard icon="⚠️" value={highRiskCount} label="High Risk Alerts" bg="var(--red-pale)" color="var(--red)" />
          <StatCard icon="📅" value={lastScreening} label="Last Screening" bg="#f5f3ff" color="#7c3aed" />
        </Grid>

        {/* Tabs */}
        <div className="tab-bar" style={{ marginBottom: 32 }}>
          <button className={`tab-btn ${tab === 'children' ? 'active' : ''}`} onClick={() => setTab('children')}>
            Children Profiles
          </button>
          <button className={`tab-btn ${tab === 'interventions' ? 'active' : ''}`} onClick={() => setTab('interventions')}>
            Intervention Plans
          </button>
        </div>

        {tab === 'children' && (
          <div className="animate-fadeIn">
            {/* Children Grid */}
            <SectionHeading title="Your Children" subtitle="Manage your children's profiles and start diagnostic screenings." />

            {children.length === 0 ? (
              <Card premium p="60px" style={{ marginBottom: 48 }}>
                <EmptyState icon="👶" title="No children added yet" desc="Add your child's profile to start the AI-powered developmental screening." action={<Btn onClick={() => navigate('/add-child')}>Add Child Profile</Btn>} />
              </Card>
            ) : (
              <Grid cols={2} style={{ marginBottom: 64 }}>
                {children.map((c, i) => (
                  <Card key={c._id} premium p="32px" className={`animate-fadeInUp delay-${i+1}`} style={{ position: 'relative' }}>
                {/* Actions */}
                <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 8 }}>
                  <button onClick={() => navigate(`/parent/child/${c._id}/edit`)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--cream)', color: 'var(--mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: '1.5px solid var(--border)', transition: 'var(--transition)' }}>✏️</button>
                  <button onClick={() => setDeleteModal(c)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red-pale)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: 'none', transition: 'var(--transition)' }}>🗑️</button>
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 28 }}>
                  <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '2px solid var(--white)', boxShadow: 'var(--shadow-sm)' }}>
                    {(!c.avatar || c.avatar === 'default-avatar') ? '👶' : c.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--dark)' }}>{c.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', display: 'flex', gap: 12, marginTop: 6, fontWeight: 600 }}>
                      <span>{c.dob ? new Date().getFullYear() - new Date(c.dob).getFullYear() : '--'} years old</span>
                      <span style={{ opacity: 0.3 }}>|</span>
                      <span>{c.gender ? c.gender.charAt(0).toUpperCase() + c.gender.slice(1) : '--'}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-sm)', padding: 20, marginBottom: 28, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Latest Screening</span>
                    <Badge risk={c.risk || 'Low'} />
                  </div>
                  <ScoreBar score={c.score || 0} total={c.total || 20} risk={c.risk || 'Low'} height={12} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{c.lastScreen ? new Date(c.lastScreen).toLocaleDateString('en-GB') : 'No screenings yet'}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--dark)', fontWeight: 900 }}>Score: {c.score || 0} / {c.total || 20}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Btn variant="primary" style={{ flex: 1.5 }} onClick={() => navigate(`/visual-screening?childId=${c._id}`)}>AI Assessment</Btn>
                  <Btn variant="outline" style={{ flex: 1 }} onClick={() => navigate(`/report?childId=${c._id}`)}>Reports</Btn>
                </div>
                  </Card>
                ))}
              </Grid>
            )}

            {/* History Preview — only show when there are screenings */}
            {recentScreenings.length > 0 && (
            <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <SectionHeading title="Recent Activity" subtitle="Quick overview of the latest screening results." style={{ marginBottom: 0 }} />
              <Btn variant="ghost" onClick={() => navigate('/report')}>View Full History →</Btn>
            </div>

            <Card className="table-wrap" premium p="0">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Child Profile</th>
                    <th>Diagnostic Score</th>
                    <th>Risk Classification</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScreenings.length > 0 ? recentScreenings.map((row, i) => (
                    <tr key={row._id} className={`animate-fadeInUp delay-${i+2}`}>
                      <td style={{ fontWeight: 700 }}>{new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ fontWeight: 600 }}>{row.childName}</td>
                      <td style={{ fontWeight: 900 }}>{row.score} <span style={{ opacity: 0.3, fontWeight: 500 }}>/ {row.total}</span></td>
                      <td><Badge risk={row.risk} /></td>
                      <td>
                        <span className={`status-pill ${row.status === 'completed' ? 'reviewed' : 'pending'}`} style={{
                          padding: '4px 10px',
                          borderRadius: 99,
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: row.status === 'completed' ? 'var(--green-pale)' : 'var(--amber-pale)',
                          color: row.status === 'completed' ? '#166534' : '#92400e',
                          textTransform: 'uppercase'
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Btn size="sm" variant="ghost" onClick={() => navigate(`/report?childId=${row.childId}`)}>Details</Btn>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" style={{ padding: 60, textAlign: 'center', color: 'var(--muted)', fontSize: '1rem' }}>No recent screening activity found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
            </>
            )}
          </div>
        )}

        {tab === 'interventions' && (
          <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <SectionHeading title="Personalized Interventions" subtitle="Evidence-based activities tailored to your child's risk profile." style={{ marginBottom: 0 }} />
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--mid)', textTransform: 'uppercase' }}>Select Child</label>
                <select
                  value={selectedChildForIntervention}
                  onChange={(e) => setSelectedChildForIntervention(e.target.value)}
                  className="form-select"
                  style={{ minWidth: 240, fontWeight: 700 }}
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <InterventionPlan childId={selectedChildForIntervention} />
          </div>
        )}
      </Container>
    </PageWrapper>
  );
}
