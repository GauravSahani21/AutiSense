import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageWrapper, Card, Badge, Btn, Select, BackBtn } from '../components/UI';
import { children as childrenApi, screenings as screeningsApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const childIdParam = searchParams.get('childId');

  const [children, setChildren] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterChild, setFilterChild] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');
  const [sortDate, setSortDate] = useState('Newest');

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const [childrenRes, screeningsRes] = await Promise.all([
          childrenApi.getAll(),
          screeningsApi.getAll(),
        ]);
        const kids = childrenRes.data || [];
        setChildren(kids);
        setScreenings(screeningsRes.data || []);

        if (childIdParam) {
          const match = kids.find((c) => c._id === childIdParam);
          if (match) setFilterChild(match.name);
        }
      } catch (err) {
        console.error('Failed to load screening history:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated, childIdParam]);

  const historyRows = useMemo(
    () =>
      screenings.map((row) => ({
        _id: row._id,
        childId: row.childId?._id || row.childId,
        child: row.childId?.name || 'Unknown Child',
        date: row.screeningDate || row.createdAt,
        score: row.score ?? 0,
        total: 20,
        risk: row.riskLevel || 'Low',
        status:
          row.status === 'reviewed'
            ? 'Reviewed'
            : row.status === 'pending'
            ? 'Pending'
            : 'Completed',
      })),
    [screenings]
  );

  const filtered = historyRows
    .filter((h) => filterChild === 'All' || h.child === filterChild)
    .filter((h) => filterRisk === 'All' || h.risk === filterRisk)
    .sort((a, b) => {
      if (sortDate === 'Newest') return new Date(b.date) - new Date(a.date);
      return new Date(a.date) - new Date(b.date);
    });

  const counts = {
    total: filtered.length,
    low: filtered.filter((h) => h.risk === 'Low').length,
    medium: filtered.filter((h) => h.risk === 'Medium').length,
    high: filtered.filter((h) => h.risk === 'High').length,
  };

  if (loading) {
    return (
      <PageWrapper style={{ padding: '40px 24px' }}>
        <div className="container">
          <BackBtn onClick={() => navigate('/parent')} />
          <p style={{ marginTop: 24 }}>Loading screening history…</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper style={{ padding: '40px 24px' }}>
      <div className="container">
        <BackBtn onClick={() => navigate('/parent')} />
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2rem', marginBottom: 24 }}>
          Screening History
        </h1>

        <div className="grid-4" style={{ marginBottom: 32 }}>
          <Card style={{ padding: 20, textAlign: 'center', background: 'var(--cream)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>{counts.total}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Total Screenings</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center', background: 'var(--green-pale)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--green)', fontFamily: 'var(--font-heading)' }}>{counts.low}</div>
            <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>Low Risk</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center', background: 'var(--amber-pale)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--amber)', fontFamily: 'var(--font-heading)' }}>{counts.medium}</div>
            <div style={{ fontSize: '0.8rem', color: '#92400E', fontWeight: 600 }}>Medium Risk</div>
          </Card>
          <Card style={{ padding: 20, textAlign: 'center', background: 'var(--red-pale)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--red)', fontFamily: 'var(--font-heading)' }}>{counts.high}</div>
            <div style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 600 }}>High Risk</div>
          </Card>
        </div>

        <Card style={{ padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Select label="Filter by Child" value={filterChild} onChange={(e) => setFilterChild(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="All">All Children</option>
              {children.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Select label="Filter by Risk" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="All">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </Select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Select label="Sort by Date" value={sortDate} onChange={(e) => setSortDate(e.target.value)} style={{ marginBottom: 0 }}>
              <option value="Newest">Newest First</option>
              <option value="Oldest">Oldest First</option>
            </Select>
          </div>
        </Card>

        <Card className="table-wrap animate-fadeInUp">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Child</th>
                <th>Score</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row._id}>
                  <td style={{ fontWeight: 600 }}>{new Date(row.date).toLocaleDateString()}</td>
                  <td>{row.child}</td>
                  <td>{row.score} / {row.total}</td>
                  <td><Badge risk={row.risk} /></td>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{row.status}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <Btn
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        navigate(`/parent/child/${row.childId}/details`, { state: { tab: 'history' } })
                      }
                    >
                      View Details
                    </Btn>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
                    <div style={{ fontWeight: 600 }}>No screenings yet</div>
                    <div style={{ fontSize: '0.85rem' }}>Complete a screening or adjust your filters</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </PageWrapper>
  );
}
