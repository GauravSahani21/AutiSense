import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { children as childrenApi, auth } from '../api';
import { Container, PageWrapper, SectionHeading, Card, Btn, Badge, Input, useToast, Grid, RoleBadge } from '../components/UI';
import { User, Phone, Mail, Shield, Calendar, Edit2, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchChildren = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await childrenApi.getAll();
        setChildren(res.data || []);
      } catch (err) {
        showToast('Failed to load children profiles', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, [isAuthenticated]);

  const handleEditChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await auth.updateDetails(formData);
      // We need to re-login or update context, for now we will just show toast
      showToast('Profile updated successfully!', 'success');
      setIsEditing(false);
      // Optional: If context needs updating, reload window or update context manually
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Profile...</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {ToastComponent}
      <Container style={{ padding: '60px 0' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.8rem', color: 'var(--dark)', letterSpacing: '-0.02em' }}>
              Your Profile
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--muted)', marginTop: 6, fontWeight: 500 }}>
              Manage your personal information and associated family profiles.
            </p>
          </div>
        </div>

        <Grid cols={2} gap="40px" style={{ marginBottom: 64 }}>
          {/* Left Column: Parent Details */}
          <Card premium p="40px" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-solid)' }}>
                  <User size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>Account Details</h3>
                  <RoleBadge role={user?.role} />
                </div>
              </div>
              {!isEditing && (
                <Btn variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} style={{ marginRight: 6 }} /> Edit
                </Btn>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Input label="Full Name" name="name" value={formData.name} onChange={handleEditChange} required />
                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleEditChange} placeholder="Optional" />
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  <Btn type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Changes'}</Btn>
                  <Btn variant="outline" onClick={() => setIsEditing(false)} style={{ flex: 1 }}>Cancel</Btn>
                </div>
              </form>
            ) : (
              <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <User size={20} className="text-orange" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Full Name</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Mail size={20} className="text-orange" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Email Address</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Phone size={20} className="text-orange" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phone Number</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{user?.phone || 'Not provided'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Shield size={20} className="text-orange" />
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Account Role</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Right Column: Children List */}
          <Card premium p="40px" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>Family Profiles</h3>
              <Btn size="sm" onClick={() => navigate('/add-child')}>+ Add Child</Btn>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 8 }}>
              {children.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                  <p>No children profiles added yet.</p>
                </div>
              ) : (
                children.map(c => (
                  <div key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'var(--cream)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                      {(!c.avatar || c.avatar === 'default-avatar') ? '👶' : c.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dark)', marginBottom: 2 }}>{c.name}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', gap: 8 }}>
                        <span>{c.dob ? new Date().getFullYear() - new Date(c.dob).getFullYear() : '--'} yrs</span>
                        <span>•</span>
                        <span>{c.gender ? c.gender.charAt(0).toUpperCase() + c.gender.slice(1) : '--'}</span>
                      </div>
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => navigate(`/parent/child/${c._id}/details`)}>View</Btn>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Grid>
      </Container>
    </PageWrapper>
  );
}
