import { Link } from 'react-router-dom';
import { motion, useTransform } from 'framer-motion';
import { ArrowRight, ChevronDown, Leaf } from 'lucide-react';

/**
 * Four narrative panels, crossfaded by scroll progress.
 * Synced with CinematicHero's scene transitions:
 *   t ∈ [0.00 – 0.22]  Frame 1  (the seed)
 *   t ∈ [0.25 – 0.45]  Frame 2  (sprouting)
 *   t ∈ [0.50 – 0.70]  Frame 3  (matured plant)
 *   t ∈ [0.75 – 1.00]  Frame 4  (harvest / field) + CTAs
 */
export default function CinematicCopy({ scrollYProgress }) {
  // each frame: fade in → hold → fade out
  const f1Op = useTransform(scrollYProgress, [0.00, 0.04, 0.18, 0.24], [0, 1, 1, 0]);
  const f1Y  = useTransform(scrollYProgress, [0.00, 0.04, 0.18, 0.24], [16, 0, 0, -16]);

  const f2Op = useTransform(scrollYProgress, [0.26, 0.31, 0.43, 0.49], [0, 1, 1, 0]);
  const f2Y  = useTransform(scrollYProgress, [0.26, 0.31, 0.43, 0.49], [16, 0, 0, -16]);

  const f3Op = useTransform(scrollYProgress, [0.51, 0.56, 0.66, 0.72], [0, 1, 1, 0]);
  const f3Y  = useTransform(scrollYProgress, [0.51, 0.56, 0.66, 0.72], [16, 0, 0, -16]);

  const f4Op = useTransform(scrollYProgress, [0.74, 0.80, 1.00], [0, 1, 1]);
  const f4Y  = useTransform(scrollYProgress, [0.74, 0.80, 1.00], [16, 0, 0]);

  // bottom scroll-hint visible only at the very start
  const hintOp = useTransform(scrollYProgress, [0, 0.04, 0.07], [1, 1, 0]);

  // a tiny "act" indicator for narrative texture
  const actNumber = useTransform(scrollYProgress, (v) => {
    if (v < 0.25) return 'I';
    if (v < 0.50) return 'II';
    if (v < 0.75) return 'III';
    return 'IV';
  });

  return (
    <div className="absolute inset-0 grid place-items-center px-4 sm:px-6 pointer-events-none">
      {/* Act indicator — top-left */}
      <motion.div className="absolute top-24 sm:top-28 left-4 sm:left-8 flex items-center gap-3 text-cream/60 text-xs uppercase tracking-[0.25em]">
        <span className="w-6 h-px bg-mint-300/60" />
        <span>Act</span>
        <motion.span className="font-display text-mint-200">{actNumber}</motion.span>
      </motion.div>

      {/* FRAME 1 — the seed */}
      <motion.div
        style={{ opacity: f1Op, y: f1Y }}
        className="absolute text-center max-w-3xl"
      >
        <div className="chip mx-auto mb-5">
          <Leaf size={14} className="text-mint-300" />
          A new chapter for agri-supply
        </div>
        <h1 className="font-display font-extrabold text-cream leading-[1.05] tracking-tight text-4xl sm:text-6xl md:text-7xl xl:text-[5.5rem]">
          It starts with a single{' '}
          <span className="italic font-medium text-gradient" style={{ fontFamily: '"Plus Jakarta Sans", serif' }}>
            seed.
          </span>
        </h1>
        <p className="mt-5 sm:mt-7 text-cream/65 text-base sm:text-lg max-w-xl mx-auto">
          Every harvest begins quietly — with hope, soil, and one careful choice.
        </p>
      </motion.div>

      {/* FRAME 2 — sprouting */}
      <motion.div
        style={{ opacity: f2Op, y: f2Y }}
        className="absolute text-center max-w-3xl"
      >
        <div className="chip mx-auto mb-5">Real-time inventory</div>
        <h1 className="font-display font-extrabold text-cream leading-[1.05] tracking-tight text-4xl sm:text-6xl md:text-7xl xl:text-[5.5rem]">
          AgriFlow gives it{' '}
          <span className="italic font-medium text-gradient-mint" style={{ fontFamily: '"Plus Jakarta Sans", serif' }}>
            everything
          </span>{' '}
          it needs.
        </h1>
        <p className="mt-5 sm:mt-7 text-cream/65 text-base sm:text-lg max-w-xl mx-auto">
          Verified suppliers. Live stock. Transparent pricing. Trust, in every transaction.
        </p>
      </motion.div>

      {/* FRAME 3 — matured */}
      <motion.div
        style={{ opacity: f3Op, y: f3Y }}
        className="absolute text-center max-w-3xl"
      >
        <div className="chip mx-auto mb-5">ACID-safe orders</div>
        <h1 className="font-display font-extrabold text-cream leading-[1.05] tracking-tight text-4xl sm:text-6xl md:text-7xl xl:text-[5.5rem]">
          And turns it into a{' '}
          <span className="italic font-medium text-gradient" style={{ fontFamily: '"Plus Jakarta Sans", serif' }}>
            harvest.
          </span>
        </h1>
        <p className="mt-5 sm:mt-7 text-cream/65 text-base sm:text-lg max-w-xl mx-auto">
          A database that won&apos;t drop a single grain. <span className="font-mono text-mint-300/80">BEGIN; COMMIT;</span>
        </p>
      </motion.div>

      {/* FRAME 4 — the field + CTAs */}
      <motion.div
        style={{ opacity: f4Op, y: f4Y }}
        className="absolute text-center max-w-4xl pointer-events-auto"
      >
        <div className="chip mx-auto mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse-glow" />
          1,200+ farmers · 85+ suppliers · 50K+ orders
        </div>
        <h1 className="font-display font-extrabold text-cream leading-[1.05] tracking-tight text-3xl sm:text-5xl md:text-6xl xl:text-7xl">
          Where every harvest{' '}
          <span className="italic font-medium text-gradient" style={{ fontFamily: '"Plus Jakarta Sans", serif' }}>
            begins
          </span>{' '}
          with AgriFlow.
        </h1>
        <p className="mt-5 sm:mt-7 text-cream/70 text-base sm:text-lg max-w-2xl mx-auto">
          Join the marketplace built specifically for fertilizer and seed sourcing — from soil to supply, in one place.
        </p>
        <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/signup" className="btn-mint group">
            Start as a Farmer
            <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
          </Link>
          <Link to="/signup" className="btn-ghost">Join as Supplier</Link>
        </div>
      </motion.div>

      {/* Scroll hint at the very start */}
      <motion.div
        style={{ opacity: hintOp }}
        className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/55 text-[10px] uppercase tracking-[0.3em]"
      >
        <span>Scroll to begin</span>
        <ChevronDown size={16} className="animate-bounce text-mint-300" />
      </motion.div>
    </div>
  );
}
