import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Btn, Input, useToast, Container } from '../components/UI';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const { login, register, dashboardPath, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast, ToastComponent } = useToast();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      navigate(dashboardPath(user));
    }
  }, [isAuthenticated, user, navigate, dashboardPath]);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const from = location.state?.from?.pathname || null;

  const handleTab = (t) => {
    setTab(t);
    setErrors({});
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrs = {};
    if (!formData.email) newErrs.email = 'Email is required';
    if (!formData.password) newErrs.password = 'Password is required';

    if (tab === 'register') {
      if (!formData.name) newErrs.name = 'Full Name is required';
      if (!formData.confirmPassword) newErrs.confirmPassword = 'Required';
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrs.confirmPassword = 'Passwords do not match';
      }
    }

    if (Object.keys(newErrs).length > 0) {
      setErrors(newErrs);
      return;
    }

    setSubmitting(true);
    try {
      if (tab === 'login') {
        const res = await login(formData.email, formData.password, 'parent');
        if (res.ok) {
          showToast(`Welcome back, ${res.user.name}!`, 'success');
          setTimeout(() => navigate(from || dashboardPath(res.user)), 800);
        } else {
          setErrors({ email: res.error || 'Invalid credentials' });
        }
      } else {
        const res = await register(formData.name, formData.email, formData.password, formData.confirmPassword, 'parent');
        if (res.ok) {
          showToast(`Account created, ${res.user.name}!`, 'success');
          setTimeout(() => navigate(dashboardPath(res.user)), 800);
        } else {
          setErrors({ email: res.error || 'Registration failed' });
        }
      }
    } catch (err) {
      setErrors({ email: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-grid">
      {ToastComponent}

      {/* Left Panel */}
      <div className="visual-panel">
        <div className="animate-fadeInUp" style={{ maxWidth: 520, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
             <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🧠</div>
             <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.8rem', color: 'white', letterSpacing: '-0.02em' }}>
               AutiSense
             </span>
          </div>

          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.1, marginBottom: 28, letterSpacing: '-0.03em' }}>
            Early detection,<br />
            <span style={{ background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>brighter futures.</span>
          </h1>

          <p style={{ fontSize: '1.15rem', opacity: 0.8, marginBottom: 56, lineHeight: 1.7, fontWeight: 400, maxWidth: 420 }}>
            AI-powered developmental screening that helps parents identify autism spectrum indicators earlier than ever.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { icon: '🎯', title: '96.7% Accuracy', desc: 'Clinically validated screening' },
              { icon: '🤖', title: 'Multimodal AI', desc: 'Drawing, video & behavioral analysis' },
              { icon: '📊', title: 'Smart Tracking', desc: 'Longitudinal progress monitoring' }
            ].map((item, i) => (
              <div key={i} className={`animate-fadeInUp delay-${i+2}`} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{
                  fontSize: '1.3rem', width: 52, height: 52,
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
                  borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.6, fontWeight: 500 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 64, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
              {['👩', '👨', '👩‍👧', '👨‍👦'].map((a, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginLeft: i > 0 ? -8 : 0, border: '2px solid rgba(255,255,255,0.1)' }}>{a}</div>
              ))}
            </div>
            <span style={{ fontSize: '0.85rem', opacity: 0.7, fontWeight: 600 }}>Trusted by 2,400+ families</span>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="form-panel">
        <Container style={{ maxWidth: 480, padding: 0, position: 'relative', zIndex: 2 }}>
          <div className="animate-fadeInUp" style={{ marginBottom: 20 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: '0.9rem', fontWeight: 700, color: 'var(--muted)',
                cursor: 'pointer', background: 'none', border: 'none', padding: '8px 0',
                fontFamily: 'var(--font-body)', transition: 'var(--transition)'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--orange-solid)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              ← Back to Home
            </button>
          </div>

          <div className="animate-fadeInUp delay-1" style={{
            background: 'white', borderRadius: 'var(--radius-lg)', padding: '36px 32px',
            boxShadow: '0 4px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 16px' }}>
                👨‍👩‍👧
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.6rem', color: 'var(--dark)', letterSpacing: '-0.02em' }}>
                {tab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 4, fontWeight: 500 }}>
                {tab === 'login' ? 'Sign in to your parent account' : 'Register as a parent to get started'}
              </p>
            </div>

            {/* Tab Toggle */}
            <div className="segmented-control" style={{ marginBottom: 18 }}>
              <button className={`segment-btn ${tab === 'login' ? 'active' : ''}`} style={{ padding: '8px 12px' }} onClick={() => handleTab('login')}>Sign In</button>
              <button className={`segment-btn ${tab === 'register' ? 'active' : ''}`} style={{ padding: '8px 12px' }} onClick={() => handleTab('register')}>Register</button>
            </div>

            {/* Quick Demo Login Credentials */}
            {tab === 'login' && (
              <div style={{
                background: 'var(--cream)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: 18,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚡ Quick Demo Fill:</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: 'priya@gmail.com', password: 'Parent@123' }));
                      setErrors({});
                    }}
                    style={{
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange-solid)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    👨‍👩‍👧 Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: 'doctor1@hospital.com', password: 'Doctor@123' }));
                      setErrors({});
                    }}
                    style={{
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange-solid)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    👨‍⚕️ Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, email: 'admin@autisense.com', password: 'Admin@123' }));
                      setErrors({});
                    }}
                    style={{
                      background: 'white',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--dark)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange-solid)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {tab === 'register' && (
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} placeholder="Rahul Sharma" autoComplete="name" />
              )}

              <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="name@email.com" autoComplete="email" />
              <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="••••••••" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} />

              {tab === 'register' && (
                <Input label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} placeholder="••••••••" autoComplete="new-password" />
              )}

              {tab === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600 }}>
                    <input type="checkbox" style={{ accentColor: 'var(--orange-solid)', cursor: 'pointer', width: 16, height: 16 }} defaultChecked /> Remember me
                  </label>
                  <button type="button" onClick={() => showToast('Check your email for instructions.', 'info')} style={{ fontSize: '0.85rem', color: 'var(--orange-solid)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Forgot Password?
                  </button>
                </div>
              )}

              <Btn type="submit" size="lg" disabled={submitting} loading={submitting} style={{ marginTop: 4, width: '100%', padding: '12px' }}>
                {tab === 'login' ? 'Sign In →' : 'Create Account →'}
              </Btn>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 500, margin: 0 }}>
                {tab === 'login' ? "Don't have an account?" : "Already have an account?"}
                {' '}
                <button
                  onClick={() => handleTab(tab === 'login' ? 'register' : 'login')}
                  style={{ color: 'var(--orange-solid)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  {tab === 'login' ? 'Create one' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
