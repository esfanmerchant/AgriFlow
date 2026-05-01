import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Wraps any element and pulls it toward the cursor when hovered.
 * Use as: <MagneticButton><a className="btn-mint">Go</a></MagneticButton>
 */
export default function MagneticButton({ children, strength = 28, className = '' }) {
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 18 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set(((e.clientX - cx) / r.width) * strength);
    y.set(((e.clientY - cy) / r.height) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  // NOTE: do NOT set `display` via inline style — inline styles beat Tailwind
  // classes, so a consumer passing `className="hidden md:block"` would still
  // be `inline-block` at every breakpoint, breaking responsive layouts.
  // Default `inline-block` lives in className where utilities like `hidden`
  // can override it normally.
  return (
    <motion.span
      data-magnetic
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x, y }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.span>
  );
}
