import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { prefetchRoute } from './PrefetchLink.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from './Logo.jsx';
import MagneticButton from './MagneticButton.jsx';
import useEscapeKey from '../lib/useEscapeKey.js';

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how',      label: 'How it works' },
  { href: '#stack',    label: 'Tech' },
  { href: '#stories',  label: 'Stories' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  useEscapeKey(open, () => setOpen(false));

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="glass-strong rounded-2xl pl-4 pr-2 sm:pl-5 sm:pr-3 md:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 ring-1 ring-mint-400/20 shadow-[0_8px_30px_rgba(6,18,12,0.4)]">
          {/* Brand — always visible */}
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <Logo size={32} />
            <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-cream truncate">
              Agri<span className="text-gradient-mint">Flow</span>
            </span>
          </Link>

          {/* Desktop nav links — md+ only */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-cream/80">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-mint-300 transition">
                {l.label}
              </a>
            ))}
          </div>

          {/* Right cluster — split by breakpoint to avoid overflow on mobile */}
          <div className="flex items-center gap-2">
            {/* Desktop: Sign in + Get started */}
            <NavLink
              to="/login"
              onMouseEnter={() => prefetchRoute('/login')}
              onFocus={() => prefetchRoute('/login')}
              className="hidden md:inline-block px-3 py-2 rounded-xl text-sm font-semibold text-cream/80 hover:text-cream transition"
            >
              Sign in
            </NavLink>
            <div className="hidden md:block">
              <MagneticButton>
                <NavLink
                  to="/signup"
                  onMouseEnter={() => prefetchRoute('/signup')}
                  onFocus={() => prefetchRoute('/signup')}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-ink shadow-glow-mint whitespace-nowrap inline-block"
                  style={{ background: 'linear-gradient(135deg,#5eead4,#2dd4bf 50%,#0d9488)' }}
                >
                  Get started
                </NavLink>
              </MagneticButton>
            </div>

            {/* Mobile: hamburger only — Sign in / Get started live in the drawer.
                Mint-tinted background + bright border so it actually shows up
                against the glass-strong navbar (which is itself a light tint
                over dark, so a subtle white-on-white button vanishes). */}
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
              className={`md:hidden w-11 h-11 grid place-items-center rounded-xl border-2 transition active:scale-95 shrink-0 ${
                open
                  ? 'bg-gradient-to-br from-mint-300 to-mint-500 border-mint-200 text-ink shadow-glow-mint'
                  : 'bg-mint-400/15 border-mint-300/50 text-mint-200 hover:bg-mint-400/25 hover:border-mint-300/70'
              }`}
            >
              <motion.span
                key={open ? 'x' : 'menu'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                className="grid place-items-center"
              >
                {open ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Mobile drawer — links + Sign in + Get started */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-nav"
              role="menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
              className="md:hidden mt-2 glass-strong rounded-2xl p-3 ring-1 ring-mint-400/15"
            >
              <div className="flex flex-col text-sm font-medium text-cream/85">
                {navLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-mint-300 transition"
                  >
                    {l.label}
                  </a>
                ))}

                <div className="h-px bg-white/10 my-2" />

                <NavLink
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg hover:bg-white/5 hover:text-mint-300 transition"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-2 mx-1 px-4 py-2.5 rounded-xl text-sm font-bold text-ink shadow-glow-mint inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  style={{ background: 'linear-gradient(135deg,#5eead4,#2dd4bf 50%,#0d9488)' }}
                >
                  Get started
                  <ArrowRight size={16} />
                </NavLink>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
