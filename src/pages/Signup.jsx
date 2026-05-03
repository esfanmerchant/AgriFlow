import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import RolePicker from '../components/RolePicker.jsx';
import MagneticButton from '../components/MagneticButton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateEmail, validatePassword, validateName, validatePhone } from '../lib/validators.js';

export default function Signup() {
  const { signup } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'farmer' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setField = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (touched[k]) validate({ ...form, [k]: value });
  };

  const validate = (data = form) => {
    const next = {
      name: validateName(data.name),
      email: validateEmail(data.email),
      phone: validatePhone(data.phone),
      password: validatePassword(data.password),
    };
    setErrors(next);
    return !next.name && !next.email && !next.phone && !next.password;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true });
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setLoading(true);
    try {
      await signup(form);
    } catch (err) {
      // Backend returns 202 with a "Verification/Approval Pending" message
      // for new supplier signups — show it as info, not as a hard failure.
      if (err?.status === 202 || /Approval Pending/i.test(err?.message || '')) {
        toast.success('Account submitted', err.message);
      } else {
        toast.error('Sign-up failed', err?.message || 'Try again in a moment.');
      }
    } finally {
      setLoading(false);
    }
  };

  const blur = (key) => () => { setTouched((t) => ({ ...t, [key]: true })); validate(); };
  const fieldRing = (key) =>
    touched[key] && errors[key] ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400/30' : '';
  const errorRow = (key, id) => (touched[key] && errors[key] ? (
    <p id={id} className="mt-1.5 text-xs text-red-300 flex items-center gap-1.5">
      <AlertCircle size={12} /> {errors[key]}
    </p>
  ) : null);

  return (
    <AuthShell
      title="Join the network rewriting agri-procurement."
      subtitle="Create an account in under a minute. Browse fertilizers and seeds — or list your own."
      footer={<>Already have an account? <Link to="/login" className="text-mint-300 font-semibold hover:underline">Sign in</Link></>}
    >
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-cream">Create your account</h2>
      <p className="text-sm sm:text-base text-cream/60 mt-1">Pick the role that fits you best.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
        <div>
          <label className="label">Account type</label>
          <RolePicker value={form.role} onChange={(r) => setForm({ ...form, role: r })} includeAdmin={false} />
        </div>

        <div>
          <label htmlFor="signup-name" className="label">Full name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
            <input
              id="signup-name"
              autoComplete="name"
              required
              value={form.name}
              onChange={setField('name')}
              onBlur={blur('name')}
              aria-invalid={!!(touched.name && errors.name)}
              aria-describedby={touched.name && errors.name ? 'signup-name-err' : undefined}
              className={`input pl-11 ${fieldRing('name')}`}
              placeholder="Asad Khan"
            />
          </div>
          {errorRow('name', 'signup-name-err')}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="signup-email" className="label">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
              <input
                id="signup-email"
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={setField('email')}
                onBlur={blur('email')}
                aria-invalid={!!(touched.email && errors.email)}
                aria-describedby={touched.email && errors.email ? 'signup-email-err' : undefined}
                className={`input pl-11 ${fieldRing('email')}`}
                placeholder="example@gmail.com"
              />
            </div>
            {errorRow('email', 'signup-email-err')}
          </div>
          <div>
            <label htmlFor="signup-phone" className="label">Phone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
              <input
                id="signup-phone"
                autoComplete="tel"
                value={form.phone}
                onChange={setField('phone')}
                onBlur={blur('phone')}
                aria-invalid={!!(touched.phone && errors.phone)}
                aria-describedby={touched.phone && errors.phone ? 'signup-phone-err' : undefined}
                className={`input pl-11 ${fieldRing('phone')}`}
                placeholder="+92 300 1234567"
              />
            </div>
            {errorRow('phone', 'signup-phone-err')}
          </div>
        </div>

        <div>
          <label htmlFor="signup-password" className="label">Password</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-mint-300" />
            <input
              id="signup-password"
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={setField('password')}
              onBlur={blur('password')}
              aria-invalid={!!(touched.password && errors.password)}
              aria-describedby={touched.password && errors.password ? 'signup-password-err' : undefined}
              className={`input pl-11 ${fieldRing('password')}`}
              placeholder="At least 8 characters with letters and numbers"
            />
          </div>
          {errorRow('password', 'signup-password-err')}
        </div>

        <div className="text-xs text-cream/50">
          By creating an account, you agree to AgriFlow&apos;s <a href="#" className="text-mint-300">Terms</a> and <a href="#" className="text-mint-300">Privacy Policy</a>.
        </div>

        <MagneticButton className="block">
          <button type="submit" disabled={loading} className="group w-full btn-mint disabled:opacity-60">
            {loading ? 'Creating…' : 'Create account'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </button>
        </MagneticButton>
      </form>
    </AuthShell>
  );
}
