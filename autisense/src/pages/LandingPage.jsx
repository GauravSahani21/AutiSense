import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionHeading, Container, Btn, Section, Grid, GlassCard } from '../components/UI';
import { useAuth } from '../context/AuthContext';

const STATS = [
  { val: '1 in 36', label: 'Children affected by autism', emoji: '👶' },
  { val: '94%',     label: 'Screening accuracy',          emoji: '🎯' },
  { val: '5 min',   label: 'Average screening time',      emoji: '⏱️' },
  { val: '2–3 yrs', label: 'Best age to detect early',    emoji: '🔬' },
];

const STEPS = [
  { num: '01', icon: '📝', title: 'Register & Add Child',  desc: 'Create a free account and add your child\'s profile in under 2 minutes.' },
  { num: '02', icon: '🧠', title: 'Complete M-CHAT Screening', desc: 'Answer 20 simple yes/no questions about your child\'s behaviour.' },
  { num: '03', icon: '📄', title: 'Get Instant AI Report',  desc: 'Receive a detailed risk analysis with next-step recommendations.' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI Risk Prediction',   desc: 'Our trained model analyses responses against clinically validated autism markers.' },
  { icon: '💬', title: 'Chatbot 24/7',          desc: 'Ask any autism-related question to our AI assistant anytime, for free.' },
  { icon: '📊', title: 'Progress Tracking',     desc: 'Monitor your child\'s screening history over time with visual trends.' },
  { icon: '🩺', title: 'Doctor Dashboard',      desc: 'Doctors can review cases, add clinical notes, and track urgent patients.' },
  { icon: '📥', title: 'Instant PDF Reports',   desc: 'Download or share detailed screening reports with your healthcare provider.' },
  { icon: '🧩', title: 'Awareness Hub',         desc: 'Learn about early signs, therapies, and find support centres near you.' },
];

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Parent, Bengaluru', initials: 'PS', stars: 5, quote: 'AutiSense helped me spot early signs in my son Arjun. The screening was simple and the report was so clear. We caught it early and he\'s thriving now!' },
  { name: 'Sunita Patel', role: 'Parent, Ahmedabad', initials: 'SP', stars: 5, quote: 'I was worried for months but didn\'t know where to start. This tool guided me step by step. Highly recommended for every parent!' },
  { name: 'Dr. Ramesh Gupta', role: 'Developmental Paediatrician', initials: 'RG', stars: 5, quote: 'As a doctor, I recommend AutiSense as a first-step tool for parents. The M-CHAT based screening is clinically sound and the reports are well structured.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, dashboardPath } = useAuth();

  const handleStartScreening = () => {
    if (isAuthenticated && user) {
      navigate(dashboardPath ? dashboardPath(user) : '/parent');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ background: 'var(--cream)', overflowX: 'hidden' }}>

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', position: 'relative', paddingTop: 88, overflow: 'hidden', display: 'block' }}>
        {/* Background Decorative Elements */}
        <div style={{ 
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundImage: 'radial-gradient(rgba(255,107,43,0.04) 1.5px, transparent 1.5px)', 
          backgroundSize: '40px 40px', opacity: 1, zIndex: 0 
        }} />
        
        {/* Enhanced Symmetrical Blobs - POSITIONS FIXED TO ABSOLUTE */}
        <div className="blob animate-float" style={{ position: 'absolute', width: 900, height: 900, background: 'radial-gradient(circle, rgba(255,107,43,0.1) 0%, transparent 70%)', top: -300, right: -200, opacity: 1, zIndex: 1 }} />
        <div className="blob animate-float" style={{ position: 'absolute', width: 800, height: 800, background: 'radial-gradient(circle, rgba(255,214,107,0.06) 0%, transparent 70%)', bottom: -200, left: -200, opacity: 1, animationDelay: '-4s', zIndex: 1 }} />
        
        {/* Decorative Rings */}
        <div style={{ position: 'absolute', top: '15%', left: '2%', width: 400, height: 400, border: '1.5px solid rgba(255,107,43,0.05)', borderRadius: '50%', zIndex: 1 }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, border: '1.5px solid rgba(255,107,43,0.03)', borderRadius: '50%', zIndex: 1 }} />

        {/* Full-width content wrapper — matched exactly with Navbar logo alignment (32px) */}
        <div style={{ 
          width: '100%', minHeight: 'calc(100vh - 88px)', 
          padding: '0 32px', position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 100, width: '100%', alignItems: 'center' }}>
            
            {/* Left Column: Expanded Content */}
            <div className="animate-slideLeft">
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 12,
                background: 'white', border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-full)', padding: '12px 28px',
                fontSize: '0.9rem', fontWeight: 900, color: 'var(--orange-solid)',
                marginBottom: 40, boxShadow: 'var(--shadow-sm)',
              }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, background: 'var(--orange)', borderRadius: '50%' }} className="animate-pulse" />
                WORLD-CLASS AI NEURODIVERSITY SCREENING
              </div>

              <h1 style={{
                fontFamily: 'var(--font-heading)', fontWeight: 900,
                fontSize: 'clamp(3.5rem, 7vw, 6.2rem)', lineHeight: 0.9,
                color: 'var(--dark)', marginBottom: 36, letterSpacing: '-0.05em'
              }}>
                Early Detection <br />
                <span style={{ 
                  background: 'linear-gradient(90deg, var(--orange-solid), #FF9D6C)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block'
                }}>
                  Changes Lives.
                </span>
              </h1>

              <p style={{ fontSize: '1.45rem', color: 'var(--mid)', lineHeight: 1.7, marginBottom: 56, maxWidth: 750, fontWeight: 500, opacity: 0.85 }}>
                AutiSense provides families with state-of-the-art AI vision analysis and clinically-backed screening tools to identify autism markers earlier and with greater precision.
              </p>

              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', marginBottom: 72 }}>
                <Btn size="lg" onClick={handleStartScreening} style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: 'var(--radius-md)', boxShadow: '0 20px 40px rgba(255,107,43,0.25)' }}>
                  Start Free Screening
                </Btn>
                <Btn size="lg" variant="ghost" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })} 
                  style={{ border: '2px solid var(--border)', background: 'white', padding: '24px 56px', fontSize: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                  Our Technology
                </Btn>
              </div>

              {/* Spread-out Social Proof */}
              <div style={{ display: 'flex', gap: 48, alignItems: 'center', padding: '32px 48px', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--border)', width: 'fit-content', backdropFilter: 'blur(30px)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ 
                      width: 52, height: 52, borderRadius: '50%', 
                      background: `hsl(${i * 45}, 80%, 90%)`, 
                      border: '4px solid white', marginLeft: i === 1 ? 0 : -18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem', boxShadow: 'var(--shadow-sm)'
                    }}>
                      {['👶', '👩‍⚕️', '👨‍👩‍👧', '🏥', '🔬'][i-1]}
                    </div>
                  ))}
                </div>
                <div style={{ borderLeft: '2.5px solid var(--border)', paddingLeft: 32 }}>
                  <div style={{ display: 'flex', gap: 6, color: 'var(--yellow)', marginBottom: 8 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: '1.3rem' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--dark)', margin: 0, letterSpacing: '0.02em' }}>Trusted by 15,000+ Families Globally</p>
                </div>
              </div>
            </div>

            {/* Right Column: Expansive Mockup */}
            <div className="animate-slideRight" style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end' }}>
              {/* Stat Cards */}
              <div style={{ 
                position: 'absolute', top: '5%', right: '2%', width: 180, height: 180, 
                background: 'white', borderRadius: 36, boxShadow: 'var(--shadow-xl)', 
                zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 12, border: '1.5px solid var(--border)'
              }} className="animate-float">
                <div style={{ width: 64, height: 64, background: 'var(--orange-pale)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎯</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--orange-solid)' }}>94%</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accuracy</div>
                </div>
              </div>

              <div style={{ 
                position: 'absolute', bottom: '10%', left: '-20%', padding: '24px 40px', 
                background: 'white', borderRadius: 32, boxShadow: 'var(--shadow-xl)', 
                zIndex: 3, display: 'flex', alignItems: 'center', gap: 18, border: '1.5px solid var(--border)',
                animationDelay: '-2.5s'
              }} className="animate-float">
                <div style={{ width: 20, height: 20, background: 'var(--green)', borderRadius: '50%', boxShadow: '0 0 15px var(--green)' }} className="animate-pulse" />
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--dark)' }}>AI Analysis Live</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>Real-time biometric monitoring...</div>
                </div>
              </div>

              {/* Premium Phone Mockup */}
              <div style={{
                width: 360, height: 720, background: '#080808', borderRadius: 64,
                padding: '20px', boxShadow: '0 100px 200px -20px rgba(30,20,16,0.35)', 
                border: '12px solid #1a1a1a', position: 'relative', zIndex: 2,
                transform: 'perspective(1500px) rotateY(-10deg) rotateX(5deg)'
              }}>
                <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)', width: 110, height: 36, background: '#000', borderRadius: 18, zIndex: 10 }} />
                
                <div style={{ 
                  width: '100%', height: '100%', background: 'var(--white)', borderRadius: 48, 
                  overflow: 'hidden', position: 'relative', border: '1px solid rgba(0,0,0,0.05)' 
                }}>
                  <div style={{ padding: '80px 32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>Diagnosis</div>
                      <div style={{ fontSize: '1.8rem' }}>⚙️</div>
                    </div>
                    
                    <div style={{ background: 'var(--orange-pale)', padding: 36, borderRadius: 36, marginBottom: 40, textAlign: 'center', border: '1.5px solid var(--border)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>Confidence Score</div>
                      <div style={{ fontSize: '3.6rem', fontWeight: 900, color: 'var(--orange-solid)', lineHeight: 1 }}>98.2%</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green)', marginTop: 14 }}>✓ High Reliability</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                      {[
                        { label: 'Social Engagement', val: 88, color: 'var(--blue)' },
                        { label: 'Eye Fixation', val: 94, color: 'var(--orange-solid)' },
                        { label: 'Motor Response', val: 91, color: 'var(--green)' }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, marginBottom: 12 }}>
                            <span>{item.label}</span>
                            <span style={{ color: item.color }}>{item.val}%</span>
                          </div>
                          <div style={{ height: 14, background: 'var(--cream)', borderRadius: 7, overflow: 'hidden', border: '1.5px solid var(--border-light)' }}>
                            <div style={{ width: `${item.val}%`, height: '100%', background: item.color, borderRadius: 7 }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Btn style={{ width: '100%', marginTop: 56, padding: '24px', borderRadius: 28 }} size="sm">
                      Detailed Report
                    </Btn>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <Section id="how" style={{ background: 'white' }}>
        <Container>
          <SectionHeading label="How It Works" title="Three Simple Steps" subtitle="Get your child screened in minutes with our guided, clinically validated process." center />
          <Grid cols={3} gap="28px">
            {STEPS.map((s, i) => (
              <div key={i} className={`animate-fadeInUp delay-${i + 1}`} style={{
                background: 'var(--cream)', borderRadius: 'var(--radius-lg)',
                padding: '36px 28px', position: 'relative', overflow: 'hidden',
                border: '1.5px solid var(--border)',
              }}>
                <div style={{
                  position: 'absolute', top: -8, right: 12,
                  fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
                  color: 'rgba(255,107,43,0.06)', lineHeight: 1, userSelect: 'none',
                }}>{s.num}</div>
                <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>{s.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.15rem', color: 'var(--dark)', marginBottom: 10 }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'var(--mid)', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <Section style={{ background: 'linear-gradient(135deg, #1E1410 0%, #2d1f15 100%)' }}>
        <Container>
          <SectionHeading label="Features" title="Everything You Need" subtitle="Powerful tools for parents, doctors, and healthcare administrators." center light />
          <Grid cols={3} gap="20px">
            {FEATURES.map((f, i) => (
              <div key={i} className={`animate-fadeInUp delay-${(i % 3) + 1}`} style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 'var(--radius-lg)', padding: '28px 24px',
                transition: 'all 0.25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,107,43,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,107,43,0.30)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              >
                <div style={{ fontSize: '2rem', marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.05rem', color: 'white', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* ── STATS BANNER ──────────────────────────────── */}
      <section style={{ padding: '60px 0', background: 'var(--orange)' }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, textAlign: 'center' }}>
            {STATS.map((s, i) => (
              <div key={i} className={`animate-fadeInUp delay-${i + 1}`}>
                <div style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'white', marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────── */}
      <Section style={{ background: 'white' }}>
        <Container>
          <SectionHeading label="Testimonials" title="Parents Trust AutiSense" subtitle="Real stories from families who detected early and made a difference." center />
          <Grid cols={3} gap="24px">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: 'var(--cream)', borderRadius: 'var(--radius-lg)', padding: 32, border: '1.5px solid var(--border)' }}>
                <div style={{ color: 'var(--yellow)', fontSize: '1rem', marginBottom: 14 }}>{'★'.repeat(t.stars)}</div>
                <p style={{ fontSize: '0.95rem', color: 'var(--mid)', lineHeight: 1.7, marginBottom: 24, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'var(--orange)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem',
                  }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--dark)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* ── CTA BANNER ────────────────────────────────── */}
      <section style={{ padding: '100px 0', background: 'linear-gradient(135deg, var(--orange-solid) 0%, var(--orange-deep) 100%)' }}>
        <Container style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '2.8rem', color: 'white', marginBottom: 18, letterSpacing: '-0.02em' }}>
            Start Your Child's Screening Today
          </h2>
          <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.9)', marginBottom: 40, maxWidth: 600, marginInline: 'auto' }}>
            Join thousands of parents who have taken the first step towards their child's bright future. It's free and only takes 5 minutes.
          </p>
          <Btn
            variant="ghost"
            size="lg"
            onClick={handleStartScreening}
            style={{
              background: 'white', color: 'var(--orange-solid)',
              border: 'none', boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
            }}
          >🧡 Start Free Screening</Btn>
        </Container>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer style={{ background: 'var(--dark)', padding: '80px 0 32px' }}>
        <Container>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 64 }}>
            {/* Brand */}
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.6rem', color: 'white', marginBottom: 18 }}>
                <span style={{ color: 'var(--orange)' }}>Auti</span>Sense
              </div>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, maxWidth: 280 }}>
                Revolutionizing early autism detection through AI and clinical excellence. Empowering parents since 2024.
              </p>
            </div>
            {/* Links */}
            {[
              { heading: 'Platform', links: ['Start Screening', 'Parent Dashboard', 'Doctor Portal', 'Admin Panel'] },
              { heading: 'Learn', links: ['What is Autism?', 'Early Signs', 'M-CHAT Guide', 'Therapy Options'] },
              { heading: 'Support', links: ['FAQ', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
                  {col.heading}
                </div>
                {col.links.map(l => (
                  <div key={l} style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: 12, cursor: 'pointer', transition: 'var(--transition)' }}
                    onMouseEnter={e => e.target.style.color = 'var(--orange)'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  >{l}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>© 2024 AutiSense Platform. All rights reserved.</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>Crafted with 🧡 for developmental health</div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
