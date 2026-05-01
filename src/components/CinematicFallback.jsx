import { Link } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';

/**
 * Static fallback for the cinematic hero.
 * Used when the user prefers reduced motion — preserves the same brand
 * tone (the "frame 4" payoff) without scroll-driven animation.
 */
export default function CinematicFallback() {
  return (
    <section
      id="main"
      className="relative min-h-screen flex items-center justify-center pt-28 pb-12 sm:pt-32 sm:pb-16 px-4 sm:px-6 overflow-hidden"
    >
      <div className="hidden sm:block pointer-events-none absolute -left-40 top-1/3 w-[420px] h-[420px] rounded-full bg-mint-500/15 blur-3xl" />
      <div className="hidden sm:block pointer-events-none absolute -right-40 -top-20 w-[480px] h-[480px] rounded-full bg-gold-300/12 blur-3xl" />
      <div className="relative max-w-4xl text-center">
        <div className="chip mx-auto mb-5">
          <Leaf size={14} className="text-mint-300" />
          1,200+ farmers · 85+ suppliers · 50K+ orders
        </div>
        <h1 className="font-display font-extrabold text-cream leading-[1.05] tracking-tight text-4xl sm:text-6xl md:text-7xl xl:text-[5.5rem]">
          Where every harvest{' '}
          <span className="italic font-medium text-gradient" style={{ fontFamily: '"Plus Jakarta Sans", serif' }}>
            begins
          </span>{' '}
          with AgriFlow.
        </h1>
        <p className="mt-5 sm:mt-7 text-cream/70 text-base sm:text-lg max-w-2xl mx-auto">
          A 3D agri-supply marketplace connecting farmers and suppliers — real-time stock, transparent pricing, and ACID-safe transactions powering every order.
        </p>
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="btn-mint group">
            Start as a Farmer
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </Link>
          <Link to="/signup" className="btn-ghost">Join as Supplier</Link>
        </div>
      </div>
    </section>
  );
}
