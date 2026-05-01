import { Link } from 'react-router-dom';

/* Each route's dynamic import is keyed by path; warm them on hover/focus. */
const importers = {
  '/login':    () => import('../pages/Login.jsx'),
  '/signup':   () => import('../pages/Signup.jsx'),
  '/farmer':   () => import('../pages/FarmerDashboard.jsx'),
  '/supplier': () => import('../pages/SupplierDashboard.jsx'),
  '/admin':    () => import('../pages/AdminDashboard.jsx'),
};

const warmed = new Set();

export function prefetchRoute(to) {
  const key = typeof to === 'string' ? to.split('?')[0] : '';
  if (!key || warmed.has(key)) return;
  const imp = importers[key];
  if (!imp) return;
  warmed.add(key);
  imp().catch(() => warmed.delete(key));
}

/**
 * Drop-in replacement for react-router's Link that pre-imports the route
 * chunk on hover/focus. The chunk is in cache by the time the click fires.
 */
export default function PrefetchLink({ to, onMouseEnter, onFocus, ...rest }) {
  const handleEnter = (e) => { prefetchRoute(to); onMouseEnter?.(e); };
  const handleFocus = (e) => { prefetchRoute(to); onFocus?.(e); };
  return <Link to={to} onMouseEnter={handleEnter} onFocus={handleFocus} {...rest} />;
}
