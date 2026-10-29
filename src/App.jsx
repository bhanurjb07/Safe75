import { AnimatePresence, MotionConfig, useIsPresent } from 'framer-motion';
import { lazy, Suspense, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import DebugPanel from './components/DebugPanel.jsx';
import EnvErrorScreen from './components/EnvErrorScreen.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { DashboardSkeleton } from './components/Skeleton.jsx';
import Toaster from './components/Toaster.jsx';
import { MISSING_ENV } from './config/env.js';
import AppShell from './layouts/AppShell.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuthStore } from './store/authStore.js';
import './store/themeStore.js';

const Subjects = lazy(() => import('./pages/Subjects.jsx'));
const History = lazy(() => import('./pages/History.jsx'));
const Planner = lazy(() => import('./pages/Planner.jsx'));
const Insights = lazy(() => import('./pages/Insights.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const About = lazy(() => import('./pages/About.jsx'));

/**
 * Route guard that keeps rendering its children while the screen animates out,
 * so logging in or out transitions smoothly instead of blanking first.
 */
function Guard({ allow, to, children }) {
  const isPresent = useIsPresent();
  const wasAllowed = useRef(allow);
  if (allow) {
    wasAllowed.current = true;
    return children;
  }
  if (!wasAllowed.current) return <Navigate to={to} replace />;
  return (
    <>
      {children}
      {isPresent && <Navigate to={to} replace />}
    </>
  );
}

const page = (el) => (
  <ErrorBoundary>
    <Suspense fallback={<DashboardSkeleton />}>{el}</Suspense>
  </ErrorBoundary>
);

function AnimatedRoutes() {
  const location = useLocation();
  const session = useAuthStore((s) => s.session);
  const area = location.pathname.startsWith('/login') ? 'login' : 'app';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={area}>
        <Route
          path="/login"
          element={
            <Guard allow={!session} to="/">
              <Login />
            </Guard>
          }
        />
        <Route
          element={
            <Guard allow={Boolean(session)} to="/login">
              <AppShell />
            </Guard>
          }
        >
          <Route index element={page(<Dashboard />)} />
          <Route path="subjects" element={page(<Subjects />)} />
          <Route path="history" element={page(<History />)} />
          <Route path="planner" element={page(<Planner />)} />
          <Route path="insights" element={page(<Insights />)} />
          <Route path="notifications" element={page(<Notifications />)} />
          <Route path="reports" element={page(<Reports />)} />
          <Route path="about" element={page(<About />)} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <ErrorBoundary>
          {MISSING_ENV.length > 0 ? <EnvErrorScreen missing={MISSING_ENV} /> : <AnimatedRoutes />}
        </ErrorBoundary>
        <Toaster />
        <DebugPanel />
      </BrowserRouter>
    </MotionConfig>
  );
}
