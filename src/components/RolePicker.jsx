import { motion } from 'framer-motion';

const ALL_ROLES = [
  { key: 'farmer',   label: 'Farmer',   icon: '🌾' },
  { key: 'supplier', label: 'Supplier', icon: '🏭' },
  { key: 'admin',    label: 'Admin',    icon: '🛡️' },
];

// `includeAdmin` is true on the login page (admins still sign in) and false
// on the signup page (admin accounts are issued internally, never self-served).
export default function RolePicker({ value, onChange, includeAdmin = true }) {
  const roles = includeAdmin ? ALL_ROLES : ALL_ROLES.filter((r) => r.key !== 'admin');
  const cols = roles.length === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${cols} gap-2`}>
      {roles.map((r) => {
        const active = value === r.key;
        return (
          <button
            type="button"
            key={r.key}
            onClick={() => onChange(r.key)}
            className={`relative px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition border ${
              active
                ? 'border-mint-400 text-ink'
                : 'border-white/10 text-cream/70 hover:text-cream hover:border-white/20'
            }`}
          >
            {active && (
              <motion.span
                layoutId="role-active"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-mint-300 to-mint-500 shadow-glow-mint"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative block text-xl sm:text-2xl mb-1">{r.icon}</span>
            <span className="relative">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}
