import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import PageTransition from './PageTransition.jsx';

export default function DashShell({ sidebarItems, active, onSelect, children }) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen flex">
        <Sidebar
          items={sidebarItems}
          active={active}
          onSelect={onSelect}
          mobileOpen={navOpen}
          onClose={() => setNavOpen(false)}
        />

        {/* Mobile menu button — visible below lg */}
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          className="lg:hidden fixed top-3 left-3 z-[100] w-11 h-11 grid place-items-center rounded-xl glass-strong text-cream shadow-glow-soft"
        >
          <Menu size={18} />
        </button>

        <main id="main" className="flex-1 min-w-0 max-w-full p-3 sm:p-4 lg:p-6 pt-16 sm:pt-16 lg:pt-6">
          {children}
        </main>
      </div>
    </PageTransition>
  );
}
