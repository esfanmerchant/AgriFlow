import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import RolePicker from '../components/RolePicker.jsx';
import MagneticButton from '../components/MagneticButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateEmail, validatePassword } from '../lib/validators.js';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('farmer');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = () => {
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setLoading(true);
    try {
      await login({ email, password, role });
    } catch (err) {
      toast.error('Sign-in failed', err?.message || 'Try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const fieldRing = (key) =>
    touched[key] && errors[key] ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/30' : '';

  return (
    <AuthShell
      title="Welcome back to a smarter agri-supply chain."
      subtitle="Pick up where you left off — view live stock, track orders, and grow your business."
      footer={<>New to AgriFlow? <Link to="/signup" className="text-mint-300 font-semibold hover:underline">Create an account</Link></>}
    >
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-cream">Sign in</h2>
      <p className="text-sm sm:text-base text-cream/60 mt-1">Enter your credentials to access your dashboard.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label className="label">I am signing in as</label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        <div>
          <label htmlFor="login-email" className="label">Email address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => { setTouched((t) => ({ ...t, email: true })); validate(); }}
              placeholder="example@gmail.com"
              aria-invalid={!!(touched.email && errors.email)}
              aria-describedby={touched.email && errors.email ? 'login-email-err' : undefined}
              className={`input pl-11 ${fieldRing('email')}`}
            />
          </div>
          {touched.email && errors.email && (
            <p id="login-email-err" className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
              <AlertCircle size={12} /> {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="login-password" className="label">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => { setTouched((t) => ({ ...t, password: true })); validate(); }}
              placeholder="••••••••"
              aria-invalid={!!(touched.password && errors.password)}
              aria-describedby={touched.password && errors.password ? 'login-password-err' : undefined}
              className={`input pl-11 ${fieldRing('password')}`}
            />
          </div>
          {touched.password && errors.password && (
            <p id="login-password-err" className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
              <AlertCircle size={12} /> {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-cream/60">
            <input type="checkbox" className="rounded accent-mint-400" />
            Remember me
          </label>
          <a href="#" className="text-mint-300 font-semibold hover:underline">Forgot?</a>
        </div>

        <MagneticButton className="block">
          <button
            type="submit"
            disabled={loading}
            className="group w-full btn-mint disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </button>
        </MagneticButton>
      </form>
    </AuthShell>
  );
}
