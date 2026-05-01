import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

/**
 * Massive outlined word that drifts horizontally as the user scrolls,
 * inspired by oversized typographic backdrops on portfolio sites.
 */
export default function BigBackdropWord({ word = 'AGRIFLOW', className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  return (
    <div ref={ref} className={`relative pointer-events-none select-none ${className}`}>
      <motion.h2
        style={{ x }}
        className="font-display font-extrabold outline-text whitespace-nowrap leading-none text-[18vw] md:text-[14vw] tracking-tight"
      >
        {word}
      </motion.h2>
    </div>
  );
}
