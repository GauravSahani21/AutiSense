import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, SectionHeading, Card, Btn, AnimatedCard, GlassCard, Container, Grid } from '../components/UI';
import { AWARENESS_SIGNS, RESOURCES } from '../data/dummyData';
import { ChevronLeft, Puzzle, CheckCircle2, Phone, MapPin, Clock, Globe, ArrowRight } from 'lucide-react';

export default function AwarenessPage() {
  const navigate = useNavigate();
  const [checkedItems, setCheckedItems] = useState(new Set());

  const handleCheck = (index) => {
    const next = new Set(checkedItems);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setCheckedItems(next);
  };

  const CHECKLIST = [
    "Child doesn't respond to their name by 12 months.",
    "Child avoids making eye contact.",
    "Child doesn't point to objects to show interest by 14 months.",
    "Child doesn't play 'pretend' games by 18 months.",
    "Child repeats words or phrases over and over (echolalia).",
    "Child has delayed speech and language skills.",
    "Child gets upset by minor changes in routine.",
    "Child flaps their hands, rocks their body, or spins in circles."
  ];

  return (
    <PageWrapper>
      
      {/* Hero */}
      <section style={{ 
        background: 'linear-gradient(135deg, var(--orange-pale) 0%, white 100%)', 
        padding: '80px 0 120px', 
        textAlign: 'center', 
        borderBottom: '1.5px solid var(--border)', 
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'var(--yellow)', borderRadius: '50%', opacity: 0.1, filter: 'blur(60px)' }} />
        
        <Container>
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 40 }}>
            <Btn variant="ghost" onClick={() => navigate('/')} style={{ border: '1.5px solid var(--border)', background: 'white' }}>
              <ChevronLeft size={18} /> Back to Home
            </Btn>
          </div>
          
          <div className="animate-scaleIn" style={{ 
            width: 88, height: 88, borderRadius: '28px', background: 'var(--orange)', 
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px', boxShadow: 'var(--shadow-lg)'
          }}>
            <Puzzle size={44} />
          </div>

          <h1 className="animate-fadeInUp" style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: 'var(--dark)', marginBottom: 24, letterSpacing: '-0.02em' }}>
            Autism Awareness <br /> & Resources
          </h1>
          <p className="animate-fadeInUp delay-1" style={{ fontSize: '1.25rem', color: 'var(--mid)', maxWidth: 750, margin: '0 auto', lineHeight: 1.8, fontWeight: 500, opacity: 0.9 }}>
            Early detection is the most powerful tool for better outcomes. Learn about common indicators and find professional support centers near you.
          </p>
        </Container>
      </section>

      <Container style={{ padding: '100px 0' }}>
        
        {/* Early Signs */}
        <div style={{ marginBottom: 120 }}>
          <SectionHeading 
            label="Learning" 
            title="Early Developmental Signs" 
            subtitle="Every child follows their own timeline, but these are key milestones to monitor during early childhood." 
            center 
          />
          <Grid cols={4} gap="24px">
            {AWARENESS_SIGNS.map((s, i) => (
              <AnimatedCard key={i} delay={i * 0.1}>
                <Card premium p="40px" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: 24, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}>{s.emoji}</div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--dark)', marginBottom: 14 }}>{s.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: 'var(--mid)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{s.description}</p>
                </Card>
              </AnimatedCard>
            ))}
          </Grid>
        </div>

        {/* Checklist */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, marginBottom: 120, alignItems: 'center' }}>
          <div className="animate-slideLeft">
            <SectionHeading 
              label="Observation" 
              title="Quick Indicators Checklist" 
              subtitle="If you identify several of these patterns consistently, we recommend a formal screening or pediatric consultation." 
            />
            
            <div style={{ 
              background: 'white', padding: '32px', borderRadius: 'var(--radius-lg)', 
              border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-md)',
              marginBottom: 40
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.05em' }}>AUTISM PROBABILITY INDICATOR</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--orange-solid)' }}>{Math.round((checkedItems.size / 8) * 100)}%</span>
              </div>
              <div style={{ height: 10, background: 'var(--orange-pale)', borderRadius: 5, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                <div style={{ width: `${(checkedItems.size / 8) * 100}%`, height: '100%', background: 'var(--orange)', transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
              </div>
            </div>

            {checkedItems.size >= 4 && (
              <div className="animate-fadeIn" style={{ background: 'var(--red-pale)', color: '#991B1B', padding: '20px 24px', borderRadius: 'var(--radius-md)', fontSize: '1rem', fontWeight: 700, marginBottom: 40, border: '1.5px solid rgba(239,68,68,0.2)', display: 'flex', gap: 16, alignItems: 'center' }}>
                <CheckCircle2 size={28} style={{ flexShrink: 0 }} />
                <span>You have an estimated {Math.round((checkedItems.size / 8) * 100)}% possibility based on these indicators. We strongly suggest completing our full AI screening or consulting a specialist.</span>
              </div>
            )}
            
            <Btn size="lg" onClick={() => navigate('/login')} style={{ width: '100%', maxWidth: 340 }}>
              Start Full AI Screening <ArrowRight size={20} />
            </Btn>
          </div>
          
          <AnimatedCard delay={0.2}>
            <Card premium p="40px" style={{ background: 'white' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {CHECKLIST.map((text, i) => (
                  <label key={i} style={{ 
                    display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', 
                    padding: '14px 20px', borderRadius: 'var(--radius-md)', 
                    background: checkedItems.has(i) ? 'var(--orange-pale)' : 'white', 
                    border: `1.5px solid ${checkedItems.has(i) ? 'var(--orange-light)' : 'var(--border)'}`,
                    transition: 'var(--transition)' 
                  }}>
                    <input 
                      type="checkbox" 
                      checked={checkedItems.has(i)} 
                      onChange={() => handleCheck(i)} 
                      style={{ accentColor: 'var(--orange-solid)', width: 24, height: 24, cursor: 'pointer' }} 
                    />
                    <span style={{ 
                      fontSize: '1.05rem', 
                      color: checkedItems.has(i) ? 'var(--orange-deep)' : 'var(--dark)', 
                      fontWeight: checkedItems.has(i) ? 800 : 600, 
                      lineHeight: 1.4,
                      opacity: checkedItems.has(i) ? 1 : 0.8
                    }}>
                      {text}
                    </span>
                  </label>
                ))}
              </div>
            </Card>
          </AnimatedCard>
        </div>

        {/* Resources */}
        <div style={{ marginBottom: 120 }}>
          <SectionHeading 
            label="Support Network" 
            title="Premier Therapy Centers" 
            subtitle="Access professional guidance and evidence-based intervention programs." 
            center 
          />
          <Grid cols={3} gap="28px">
            {RESOURCES.map((r, i) => (
              <AnimatedCard key={i} delay={i * 0.1}>
                <Card premium p="40px" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ 
                    display: 'inline-flex', background: 'var(--orange-pale)', color: 'var(--orange-deep)', 
                    padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', 
                    fontWeight: 900, textTransform: 'uppercase', marginBottom: 24, alignSelf: 'flex-start',
                    letterSpacing: '0.08em', border: '1px solid var(--border)'
                  }}>
                    {r.type}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--dark)', marginBottom: 24, letterSpacing: '-0.01em' }}>{r.name}</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--mid)', display: 'flex', gap: 14, alignItems: 'center', fontWeight: 600 }}>
                      <MapPin size={20} className="text-orange" /> {r.address}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--mid)', display: 'flex', gap: 14, alignItems: 'center', fontWeight: 600 }}>
                      <Phone size={20} className="text-orange" /> {r.phone}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--mid)', display: 'flex', gap: 14, alignItems: 'center', fontWeight: 600 }}>
                      <Clock size={20} className="text-orange" /> {r.hours}
                    </div>
                  </div>
                  
                  <Btn variant="ghost" size="md" style={{ marginTop: 'auto', width: '100%', border: '1.5px solid var(--border)' }}>
                    View Location
                  </Btn>
                </Card>
              </AnimatedCard>
            ))}
          </Grid>
        </div>

        {/* Global Links */}
        <AnimatedCard delay={0.4}>
          <GlassCard premium p="60px 40px" style={{ textAlign: 'center' }}>
            <SectionHeading title="Global Health Resources" subtitle="Scientific publications and international guidelines on neurodevelopmental health." center />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginTop: 40 }}>
              {['WHO Guidelines', 'NIMHANS Research', 'Action For Autism', 'Autism Society'].map((l, i) => (
                <button key={i} style={{ 
                  padding: '16px 32px', background: 'white', border: '1.5px solid var(--border)', 
                  borderRadius: 'var(--radius-full)', fontSize: '0.95rem', fontWeight: 800, 
                  color: 'var(--dark)', cursor: 'pointer', transition: 'var(--transition)', 
                  fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: 'var(--shadow-sm)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange-solid)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                >
                  <Globe size={20} className="text-orange" /> {l}
                </button>
              ))}
            </div>
          </GlassCard>
        </AnimatedCard>

      </Container>
    </PageWrapper>
  );
}
