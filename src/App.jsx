import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import CursorBlob from './components/CursorBlob.jsx';
import ScrollProgress from './components/ScrollProgress.jsx';

// Code-split: only Landing is in the initial bundle; the rest stream in
// after the landing page is interactive (or on first navigation).
const Login             = lazy(() => import('./pages/Login.jsx'));
const Signup            = lazy(() => import('./pages/Signup.jsx'));
const FarmerDashboard   = lazy(() => import('./pages/FarmerDashboard.jsx'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard.jsx'));
const AdminDashboard    = lazy(() => import('./pages/AdminDashboard.jsx'));

/* Suspense fallback that paints the same dark backdrop so a still-downloading
   chunk never shows as a blank viewport. */
function RouteFallback() {
  return <div className="min-h-screen w-full" aria-hidden />;
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className="mesh-bg" />
      <ScrollProgress />
      <CursorBlob />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/"          element={<Landing />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/signup"    element={<Signup />} />
          <Route path="/farmer"    element={<FarmerDashboard />} />
          <Route path="/supplier"  element={<SupplierDashboard />} />
          <Route path="/admin"     element={<AdminDashboard />} />
        </Routes>
      </Suspense>
    </>
  );
}
