import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function SidebarContent({ items, active, onSelect, user, logout, onClose }) {
  return (
    <div className="gradient-border flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4 sm:py-5 border-b border-white/10">
        <Logo size={36} />
        <div className="flex-1 min-w-0">
          <div className="font-display font-extrabold text-cream truncate">
            Agri<span className="text-gradient-mint">Flow</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-mint-300">{user?.role || 'guest'}</div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden w-9 h-9 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-cream"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onSelect && onSelect(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition relative ${
                isActive ? 'text-ink' : 'text-cream/70 hover:text-cream hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sb-active"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-mint-300 to-mint-500 shadow-glow-mint"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={18} className="relative z-10" />
              <span className="relative z-10">{it.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center font-bold text-ink shrink-0">
            {(user?.full_name || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-cream truncate">{user?.full_name || 'User'}</div>
            <div className="text-[11px] text-cream/50 truncate">{user?.email || ''}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-cream/80 hover:text-cream text-sm font-semibold transition"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ items = [], active, onSelect, mobileOpen = false, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="hidden lg:flex w-64 shrink-0 flex-col p-4"
      >
        <SidebarContent items={items} active={active} onSelect={onSelect} user={user} logout={logout} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 z-[120] bg-ink/70 backdrop-blur-sm"
          >
            <motion.aside
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[82vw] p-3 flex flex-col"
            >
              <SidebarContent
                items={items}
                active={active}
                onSelect={(k) => { onSelect?.(k); onClose?.(); }}
                user={user}
                logout={logout}
                onClose={onClose}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
