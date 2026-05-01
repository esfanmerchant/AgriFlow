import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import PageTransition from './PageTransition.jsx';
import Reveal from './Reveal.jsx';

const AmbientScene = lazy(() => import('./three/AmbientScene.jsx'));

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <PageTransition>
      <div className="min-h-screen grid lg:grid-cols-2 bg-blobs">
        {/* Left — 3D scene (desktop only) */}
        <aside className="relative hidden lg:flex flex-col p-8 xl:p-10 overflow-hidden">
          <div className="absolute inset-0">
            <Suspense fallback={null}>
              <AmbientScene />
            </Suspense>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-ink/40 via-transparent to-ink/80 pointer-events-none" />
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

          <Link to="/" className="relative z-10 flex items-center gap-3">
            <Logo size={42} />
            <span className="font-display font-extrabold text-xl text-cream">
              Agri<span className="text-gradient-mint">Flow</span>
            </span>
          </Link>

          <div className="relative z-10 mt-auto max-w-md">
            <Reveal>
              <div className="chip mb-3">🌱 Welcome to a smarter supply chain</div>
              <h1 className="font-display text-3xl xl:text-4xl font-extrabold text-cream leading-tight">
                {title}
              </h1>
              <p className="text-cream/70 mt-3">{subtitle}</p>
            </Reveal>
            <div className="mt-6 flex gap-3">
              {[
                { n: '9',     l: 'DB tables' },
                { n: '3',     l: 'User roles' },
                { n: '100%',  l: 'ACID safe' },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl px-4 py-3 flex-1 text-center">
                  <div className="font-display font-extrabold text-gradient-mint">{s.n}</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/50">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right — form */}
        <main id="main" className="relative flex flex-col items-center justify-center p-4 sm:p-6 md:p-10 lg:p-12">
          <div className="absolute inset-0 lg:hidden">
            <Suspense fallback={null}>
              <AmbientScene />
            </Suspense>
            <div className="absolute inset-0 bg-ink/85" />
          </div>

          {/* mobile-only logo + tagline */}
          <Link to="/" className="lg:hidden relative z-10 flex items-center gap-2.5 mb-6 sm:mb-8">
            <Logo size={36} />
            <span className="font-display font-extrabold text-xl text-cream">
              Agri<span className="text-gradient-mint">Flow</span>
            </span>
          </Link>

          <div className="relative w-full max-w-md">
            <div className="gradient-border p-5 sm:p-7 md:p-8 lg:p-10 ring-glow">
              {children}
            </div>
            {footer && <div className="text-center mt-5 sm:mt-6 text-sm text-cream/60 px-2">{footer}</div>}
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
