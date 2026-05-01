import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScroll, useSpring } from 'framer-motion';
import {
  Sprout, ShieldCheck, TrendingUp, Users, Boxes, Star,
  ArrowRight, Database, Zap, Droplet, Tractor, Sun, Wheat,
} from 'lucide-react';

import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import PageTransition from '../components/PageTransition.jsx';
import TiltCard from '../components/three/TiltCard.jsx';
import MagneticButton from '../components/MagneticButton.jsx';
import Reveal from '../components/Reveal.jsx';
import CinematicCopy from '../components/CinematicCopy.jsx';
import CinematicFallback from '../components/CinematicFallback.jsx';
import { prefetchRoute } from '../components/PrefetchLink.jsx';

// Heavy 3D scene is lazy-loaded so first paint is instant; it streams
// in over the next ~150ms while the user is reading the headline.
const CinematicHero = lazy(() => import('../components/three/CinematicHero.jsx'));

const features = [
  { icon: Boxes,       title: 'Inventory Transparency', body: 'Real-time stock so farmers never waste a trip to a hub for an out-of-stock product.', accent: 'mint'  },
  { icon: ShieldCheck, title: 'ACID Transaction Safety', body: 'SQL transactions guarantee stock is never deducted unless payment succeeds — full COMMIT/ROLLBACK.', accent: 'gold' },
  { icon: TrendingUp,  title: 'Sales Analytics',         body: 'Suppliers see top products, revenue, and trends powered by GROUP BY, SUM and aggregates.', accent: 'forest'},
  { icon: Users,       title: 'Multi-role Portals',      body: 'Farmer, Supplier, and Admin views — each tailored to their job-to-be-done.', accent: 'mint'  },
  { icon: Star,        title: 'Verified Reviews',        body: 'Farmers rate fertilizer quality so future buyers can make confident, data-driven choices.', accent: 'gold' },
  { icon: Database,    title: 'BCNF-Normalised DB',      body: '9 tables, every determinant a candidate key — no transitive dependencies anywhere.', accent: 'forest'},
];

const stories = [
  { name: 'Asad Khan',     role: 'Wheat Farmer · Multan',     quote: '“AgriFlow cut my procurement time in half. Stock-out trips are over.”', emoji: '👨🏽‍🌾' },
  { name: 'Sara Mehmood',  role: 'Cotton Farmer · Bahawalpur', quote: '“Reviews helped me find a DAP supplier I actually trust.”',              emoji: '👩🏻‍🌾' },
  { name: 'FFC Logistics', role: 'Supplier · Lahore',          quote: '“The analytics dashboard is the only one we open every morning.”',     emoji: '🏭' },
];

const tech = [
  { name: 'PostgreSQL', icon: '🐘' }, { name: 'FastAPI', icon: '⚡' },
  { name: 'React',      icon: '⚛️' }, { name: 'Three.js', icon: '🎨' },
  { name: 'Tailwind',   icon: '🌊' }, { name: 'Framer',  icon: '✨' },
];

const accentMap = {
  mint:   { ring: 'from-mint-500/40 to-mint-300/10',     icon: 'from-mint-500 to-mint-300 text-ink' },
  gold:   { ring: 'from-gold-400/40 to-gold-200/10',     icon: 'from-gold-400 to-gold-200 text-ink' },
  forest: { ring: 'from-forest-400/40 to-forest-200/10', icon: 'from-forest-500 to-forest-300 text-cream' },
};

export default function Landing() {
  const heroRef = useRef(null);
  // Raw scroll progress (0 at section top in view → 1 at section bottom
  // reaching viewport top). Snaps directly to the wheel, which feels
  // mechanical for a cinematic narrative.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end end'],
  });
  // Spring-smoothed copy of scrollYProgress. The animations follow scroll
  // with a touch of inertia: when the user stops mid-frame the spring
  // continues to settle, and rapid wheel ticks no longer cause visible
  // jitter. This is the difference between "scroll-tied" and "cinematic."
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 26,
    mass: 0.45,
    restDelta: 0.0001,
  });

  // The cinematic narrative-scroll hero only works well on screens tall enough
  // to give the camera dolly room to breathe. On phones the 3.4-viewport scroll
  // feels like work and the headlines overlap the small 3D scene awkwardly. So:
  //   - reduced-motion users → static hero
  //   - viewports < md (768px) → static hero
  // Picked once on mount; we don't downgrade mid-session if the user resizes.
  const [useStaticHero, setUseStaticHero] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    return reducedMotion || isMobile;
  });

  // If the user rotates a tablet or resizes a desktop window across the md
  // breakpoint, swap to/from the static hero. Listener is cheap; only fires
  // when crossing 768px.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(max-width: 767px)');
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setUseStaticHero(mq.matches || reducedMq.matches);
    mq.addEventListener?.('change', update);
    reducedMq.addEventListener?.('change', update);
    return () => {
      mq.removeEventListener?.('change', update);
      reducedMq.removeEventListener?.('change', update);
    };
  }, []);

  // Pre-warm the most likely next routes during browser idle time so Sign in /
  // Get started navigations are instant.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
    const handle = idle(() => {
      prefetchRoute('/login');
      prefetchRoute('/signup');
    });
    return () => window.cancelIdleCallback?.(handle);
  }, []);

  return (
    <PageTransition>
      <Navbar />

      {/* CINEMATIC HERO ============================================
          Tall section (~3.5 viewport heights) so the user scrolls
          THROUGH the narrative. Inner sticky container holds a single
          full-screen 3D Canvas + an overlaid headline column. Both
          read scrollYProgress and morph in lockstep.
          ========================================================== */}
      {useStaticHero ? (
        <CinematicFallback />
      ) : (
        <section
          id="main"
          ref={heroRef}
          className="relative h-[340vh] sm:h-[360vh] lg:h-[400vh]"
        >
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* contained ambient blobs — match the rest of the page mood */}
            <div className="pointer-events-none absolute -left-40 top-1/3 w-[420px] h-[420px] rounded-full bg-mint-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-40 -top-20 w-[480px] h-[480px] rounded-full bg-gold-300/12 blur-3xl" />

            {/* The 3D scene — fills the sticky viewport */}
            <Suspense fallback={null}>
              <CinematicHero scrollYProgress={smoothProgress} />
            </Suspense>

            {/* Soft top/bottom gradients keep headline text readable
                regardless of what the 3D shows underneath */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/70 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink/80 to-transparent" />

            {/* Headlines — crossfade through 4 frames, synced to smoothed scroll */}
            <CinematicCopy scrollYProgress={smoothProgress} />
          </div>
        </section>
      )}

      {/* MARQUEE ============================================ */}
      <section className="relative py-6 sm:py-8 overflow-hidden border-y border-white/10 bg-ink/40">
        <div className="marquee-track">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center gap-6 sm:gap-12 px-4 sm:px-8 text-cream/45 text-base sm:text-xl font-display font-bold whitespace-nowrap">
              <span className="flex items-center gap-2"><Wheat size={18} className="text-mint-300" /> Fertilizers</span><span>·</span>
              <span className="flex items-center gap-2"><Sprout size={18} className="text-mint-300" /> Seeds</span><span>·</span>
              <span className="flex items-center gap-2"><Droplet size={18} className="text-mint-300" /> Pesticides</span><span>·</span>
              <span className="flex items-center gap-2"><Sun size={18} className="text-mint-300" /> Irrigation</span><span>·</span>
              <span className="flex items-center gap-2"><Tractor size={18} className="text-mint-300" /> Farm Tools</span><span>·</span>
              <span className="text-gradient">Powered by SQL Transactions</span><span>·</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES ============================================ */}
      <section id="features" className="relative section-pad cv-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
            <div className="chip mb-4 mx-auto"><Zap size={14} /> Why AgriFlow</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-cream tracking-tight leading-[1.05]">
              Every feature maps to a <span className="text-gradient-mint">real agri-supply pain point.</span>
            </h2>
            <p className="text-cream/60 mt-4 text-base sm:text-lg">
              Stock-out trips, payment disputes, zero visibility — solved with a database-first architecture.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) => {
              const a = accentMap[f.accent];
              return (
                <TiltCard key={f.title}>
                  <Reveal delay={i * 0.06} className="h-full">
                    <div className="gradient-border p-5 sm:p-6 lift relative overflow-hidden h-full">
                      <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${a.ring} blur-3xl`} />
                      <div className="relative">
                        <div className={`w-11 sm:w-12 h-11 sm:h-12 rounded-2xl grid place-items-center bg-gradient-to-br ${a.icon} mb-4 shadow-glow-mint`}>
                          <f.icon size={20} />
                        </div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-cream">{f.title}</h3>
                        <p className="text-cream/60 text-sm mt-2 leading-relaxed">{f.body}</p>
                      </div>
                    </div>
                  </Reveal>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — horizontal SQL pipeline ===================== */}
      <section id="how" className="relative section-pad cv-auto bg-ink/30 overflow-hidden">
        {/* soft accent backdrop */}
        <div className="pointer-events-none absolute -left-20 top-1/3 w-[360px] h-[360px] rounded-full bg-mint-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-1/4 w-[420px] h-[420px] rounded-full bg-gold-300/8 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* centered heading */}
          <Reveal className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="chip mb-4 mx-auto"><ShieldCheck size={14}/> Transaction safety</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-cream tracking-tight leading-[1.05]">
              An order is one <span className="text-gradient">SQL transaction.</span>
            </h2>
            <p className="text-cream/60 mt-4 text-base sm:text-lg">
              Five steps. One atomic unit. If any of them fails, every change rolls back —
              your inventory and money stay consistent, always.
            </p>
          </Reveal>

          {/* horizontal pipeline */}
          <div className="relative">
            {/* glowing horizontal connector line — desktop only */}
            <div className="hidden lg:block absolute top-7 left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-mint-400/45 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-3 relative">
              {[
                { step: 'BEGIN',    detail: 'Start the transaction. Lock the relevant rows.' },
                { step: 'CHECK',    detail: 'Verify the supplier has stock ≥ requested qty.' },
                { step: 'DEDUCT',   detail: 'Subtract the qty from inventory atomically.' },
                { step: 'RECORD',   detail: 'Insert the order + its line items into Orders.' },
                { step: 'COMMIT',   detail: 'Log payment, then COMMIT — money & stock in sync.' },
              ].map((s, i, arr) => (
                <Reveal key={s.step} delay={i * 0.07}>
                  <div className="relative gradient-border p-5 lift h-full">
                    {/* number badge floating above */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 lg:left-5 lg:translate-x-0 w-8 h-8 rounded-full bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-ink text-xs font-extrabold ring-4 ring-ink z-10 shadow-glow-mint">
                      {i + 1}
                    </div>

                    {/* connector arrow — desktop only, between cards */}
                    {i < arr.length - 1 && (
                      <div className="hidden lg:flex absolute top-1/2 -right-3.5 -translate-y-1/2 w-7 h-7 rounded-full bg-ink border border-mint-400/30 items-center justify-center z-10">
                        <ArrowRight size={12} className="text-mint-300" />
                      </div>
                    )}

                    <div className="mt-3 lg:mt-2 font-mono text-[11px] text-mint-300/80">{s.step};</div>
                    <div className="font-display text-base sm:text-lg font-bold text-cream mt-1">{s.step}</div>
                    <div className="text-xs sm:text-[13px] text-cream/60 mt-2 leading-relaxed">{s.detail}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* live status pill — replaces the old 3D panel */}
          <Reveal delay={0.45}>
            <div className="mt-8 sm:mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
              <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="absolute inset-0 rounded-full bg-mint-400 animate-pulse-glow" />
                  <span className="relative w-2.5 h-2.5 rounded-full bg-mint-400" />
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-mint-300">Live</div>
                  <div className="text-sm text-cream font-semibold">All systems COMMIT&apos;ing</div>
                </div>
              </div>
              <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
                <Zap size={16} className="text-mint-300" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/50">Avg latency</div>
                  <div className="text-sm text-cream font-semibold font-mono">38 ms</div>
                </div>
              </div>
              <div className="glass rounded-2xl px-5 py-3 flex items-center gap-3">
                <ShieldCheck size={16} className="text-mint-300" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/50">Last hour</div>
                  <div className="text-sm text-cream font-semibold font-mono">0 rollbacks</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* TECH STACK ============================================ */}
      <section id="stack" className="relative section-pad cv-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-8 sm:mb-12">
            <div className="chip mb-4 mx-auto"><Database size={14}/> Tech under the hood</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-cream">Built on a <span className="text-gradient-mint">modern stack.</span></h2>
          </Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {tech.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <div className="gradient-border p-4 sm:p-5 text-center lift">
                  <div className="text-2xl sm:text-3xl mb-2">{t.icon}</div>
                  <div className="font-semibold text-cream text-sm">{t.name}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STORIES ============================================ */}
      <section id="stories" className="relative section-pad cv-auto bg-ink/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-8 sm:mb-12">
            <div className="chip mb-4 mx-auto"><Star size={14}/> From the field</div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-cream">Stories from <span className="text-gradient">our growers.</span></h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stories.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.08}>
                <TiltCard>
                  <div className="gradient-border p-5 sm:p-6 lift h-full relative overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-mint-400/20 blur-3xl" />
                    <div className="text-4xl sm:text-5xl">{s.emoji}</div>
                    <p className="mt-3 sm:mt-4 text-cream/85 italic leading-relaxed text-sm sm:text-base">{s.quote}</p>
                    <div className="mt-4 sm:mt-5">
                      <div className="font-semibold text-cream">{s.name}</div>
                      <div className="text-xs text-cream/50">{s.role}</div>
                    </div>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ============================================ */}
      <section className="relative section-pad cv-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="relative rounded-2xl sm:rounded-[2rem] overflow-hidden p-8 sm:p-12 md:p-16 text-center gradient-border ring-glow">
              <div className="absolute inset-0 grid-pattern opacity-40" />
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-mint-400/30 blur-3xl" />
              <div className="relative">
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold text-cream leading-[1.05]">
                  Ready to grow with <span className="text-gradient">AgriFlow?</span>
                </h2>
                <p className="text-cream/70 mt-3 sm:mt-4 max-w-2xl mx-auto text-base sm:text-lg">
                  Sign up in under a minute. Whether you grow it or supply it, AgriFlow has a portal for you.
                </p>
                <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
                  <MagneticButton className="block">
                    <Link to="/signup" className="btn-mint w-full sm:w-auto">
                      Create your account <ArrowRight size={18} />
                    </Link>
                  </MagneticButton>
                  <MagneticButton className="block">
                    <Link to="/login" className="btn-ghost w-full sm:w-auto">I have an account</Link>
                  </MagneticButton>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </PageTransition>
  );
}
