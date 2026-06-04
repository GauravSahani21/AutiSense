import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScreeningProvider } from './context/ScreeningContext';

// Pages
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import ParentDashboard  from './pages/ParentDashboard';
import AddChildPage     from './pages/AddChildPage';
import ChildDetailPage  from './pages/ChildDetailPage';
import ScreeningPage    from './pages/ScreeningPage';
import ResultPage       from './pages/ResultPage';
import HistoryPage      from './pages/HistoryPage';
import AwarenessPage    from './pages/AwarenessPage';
import NotFoundPage     from './pages/NotFoundPage';
import UnifiedScanPage  from './pages/UnifiedScanPage';
import ProfilePage      from './pages/ProfilePage';

import Navbar  from './components/Navbar';
import Chatbot from './components/Chatbot';

/* ── Protected Route ─────────────────────────────── */
function ProtectedRoute({ children, roles }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/parent" replace />;
  }
  return children;
}

/* ── App Layout ──────────────────────────────────── */
function AppLayout() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"          element={<LandingPage />} />
        <Route path="/login"     element={<LoginPage />} />
        <Route path="/awareness" element={<AwarenessPage />} />
        <Route path="/visual-screening" element={<ProtectedRoute roles={['parent']}><UnifiedScanPage /></ProtectedRoute>} />
        <Route path="/drawing-analysis" element={<Navigate to="/visual-screening" replace />} />
        <Route path="/face-eye-scan"    element={<Navigate to="/visual-screening" replace />} />
        <Route path="*"          element={<NotFoundPage />} />

        {/* Parent */}
        <Route path="/parent"           element={<ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="/profile"          element={<ProtectedRoute roles={['parent']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/add-child"        element={<ProtectedRoute roles={['parent']}><AddChildPage /></ProtectedRoute>} />
        <Route path="/parent/child/:childId/details" element={<ProtectedRoute roles={['parent']}><ChildDetailPage /></ProtectedRoute>} />
        <Route path="/parent/child/:childId/edit"    element={<ProtectedRoute roles={['parent']}><ChildDetailPage /></ProtectedRoute>} />
        <Route path="/result"           element={<ProtectedRoute roles={['parent']}><ResultPage /></ProtectedRoute>} />
        <Route path="/history"          element={<ProtectedRoute roles={['parent']}><HistoryPage /></ProtectedRoute>} />
        <Route path="/report"           element={<ProtectedRoute roles={['parent']}><HistoryPage /></ProtectedRoute>} />
      </Routes>
      <Chatbot />
    </>
  );
}

/* ── Root ────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <ScreeningProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ScreeningProvider>
    </BrowserRouter>
  );
}
