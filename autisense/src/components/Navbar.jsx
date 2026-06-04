import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './UI';

export default function Navbar() {
  const { user, logout, isAuthenticated, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* shadow on scroll */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* close menu on route change or large screen resize */
  useEffect(() => { 
    setMenuOpen(false); 
    const handleResize = () => {
      if (window.innerWidth > 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [pathname]);

  const go = (path) => { navigate(path); setMenuOpen(false); };

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  const handleLogout = async () => { await logout(); navigate('/'); };

  /* ── link style helper ── */
  const linkStyle = (path) => ({
    padding: '8px 18px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: isActive(path) ? 'var(--orange-solid)' : 'var(--dark)',
    background: isActive(path) ? 'var(--orange-pale)' : 'transparent',
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'var(--transition)',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    transform: 'scale(1)',
  });

  const mobileLinkStyle = (path) => ({
    ...linkStyle(path),
    width: '100%',
    borderRadius: 'var(--radius-md)',
    padding: '12px 18px',
    justifyContent: 'flex-start',
  });

  /* ── public links ── */
  const publicLinks = (mobile = false) => {
    const s = mobile ? mobileLinkStyle : linkStyle;
    return (
      <>
        <button style={s('/awareness')} onClick={() => go('/awareness')}>
          🧩 Awareness
        </button>
        <button style={s('/visual-screening')} onClick={() => go('/visual-screening')}>
          🤖 AI Visual Screening
        </button>
        <button style={s('/login')} onClick={() => go('/login')}>
          Login
        </button>
        <button
          onClick={() => go('/login')}
          style={{
            padding: mobile ? '12px 20px' : '10px 24px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--orange)',
            color: 'white',
            fontSize: '0.88rem',
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: 'var(--shadow-md)',
            width: mobile ? '100%' : 'auto',
            transition: 'var(--transition)',
          }}
          onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
        >
          🧡 Start Screening
        </button>
      </>
    );
  };

  /* ── auth links ── */
  const authLinks = (mobile = false) => {
    const s = mobile ? mobileLinkStyle : linkStyle;
    const dash = dashboardPath();
    return (
      <>
        <button style={s('/awareness')} onClick={() => go('/awareness')}>
          🧩 Awareness
        </button>
        <button style={s('/visual-screening')} onClick={() => go('/visual-screening')}>
          🤖 AI Visual Screening
        </button>
        <button style={s(dash)} onClick={() => go(dash)}>
          Dashboard
        </button>
        <button style={s('/profile')} onClick={() => go(user ? '/profile' : '/login')}>
          👤 {user ? user.name : 'Profile'}
          {user && <RoleBadge role={user.role} />}
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: mobile ? '11px 16px' : '8px 20px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--orange-pale)',
            color: 'var(--orange-deep)',
            fontSize: '0.84rem',
            fontWeight: 700,
            border: '1.5px solid var(--border)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            width: mobile ? '100%' : 'auto',
            textAlign: 'left',
          }}
        >
          🚪 Logout
        </button>
      </>
    );
  };

  return (
    <>
      <nav
        className="navbar"
        style={{
          boxShadow: scrolled ? '0 4px 24px rgba(255,107,43,0.10)' : 'var(--shadow-sm)',
        }}
      >
        {/* Logo */}
        <button
          className="navbar-logo"
          onClick={() => go('/')}
          aria-label="AutiSense Home"
        >
          <span className="navbar-logo-dot" />
          <span style={{ color: 'var(--orange)' }}>Auti</span>
          <span style={{ color: 'var(--dark)' }}>Sense</span>
        </button>

        {/* Desktop links */}
        <div className="navbar-links">
          {isAuthenticated ? authLinks(false) : publicLinks(false)}
        </div>

        {/* Hamburger */}
        <button
          className="hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span style={{ transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none', transition: 'transform 0.25s' }} />
          <span style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.25s' }} />
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none', transition: 'transform 0.25s' }} />
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        {isAuthenticated ? authLinks(true) : publicLinks(true)}
      </div>
    </>
  );
}
