import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Topbar({ title, subtitle, action }) {
  const { user } = useAuth();
  return (
    <div className="gradient-border px-4 sm:px-6 py-3 sm:py-4 mb-4 sm:mb-6 flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-lg sm:text-xl md:text-2xl font-extrabold text-cream truncate">
          {title || <>Welcome back, <span className="text-gradient-mint">{user?.name || 'User'}</span> 👋</>}
        </h1>
        {subtitle && <p className="hidden sm:block text-xs sm:text-sm text-cream/60 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 w-60">
          <Search size={16} className="text-mint-300 shrink-0" />
          <input
            placeholder="Search…"
            className="bg-transparent outline-none text-sm text-cream placeholder:text-cream/40 flex-1 min-w-0"
          />
        </div>
        <button className="relative w-10 h-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 text-cream hover:bg-white/10 hover:shadow-glow-mint transition">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-mint-400 animate-pulse-glow" />
        </button>
        {action}
      </div>
    </div>
  );
}
