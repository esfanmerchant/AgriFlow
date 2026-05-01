import { motion } from 'framer-motion';

/**
 * Generic scroll-triggered reveal.
 *
 * Pass `immediate` for above-the-fold content — that uses `animate` (fires on
 * mount) instead of `whileInView` (fires after IntersectionObserver resolves,
 * which can flash invisible content for 1–2 frames on first paint).
 */
export default function Reveal({ children, delay = 0, y = 24, immediate = false, className = '' }) {
  const motionProps = immediate
    ? { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
      };
  return (
    <motion.div
      {...motionProps}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealText({ text, className = '', delay = 0, immediate = false }) {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((w, i) => {
        const motionProps = immediate
          ? {
              initial: { opacity: 0, y: 24 },
              animate: { opacity: 1, y: 0 },
            }
          : {
              initial: { opacity: 0, y: 30, filter: 'blur(8px)' },
              whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
              viewport: { once: true },
            };
        return (
          <motion.span
            key={i}
            {...motionProps}
            transition={{ duration: 0.6, delay: delay + i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
            className="inline-block mr-[0.25em]"
          >
            {w}
          </motion.span>
        );
      })}
    </span>
  );
}
