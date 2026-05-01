import { motion } from 'framer-motion';

/**
 * Animated AgriFlow logo — layered leaf glyph with mint glow.
 * Renders as standalone or with optional wordmark via `withMark`.
 */
export default function Logo({ size = 40, withMark = false }) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="inline-flex items-center gap-2.5 select-none"
    >
      <span className="relative inline-block" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          className="relative z-10 drop-shadow-[0_0_12px_rgba(45,212,191,0.55)]"
        >
          <defs>
            <linearGradient id="agf-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#0d9488" />
              <stop offset="50%"  stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#0f2a1f" />
            </linearGradient>
            <linearGradient id="agf-leaf-l" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#5eead4" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="agf-leaf-r" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#faedcd" />
              <stop offset="100%" stopColor="#d4a373" />
            </linearGradient>
            <radialGradient id="agf-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%"   stopColor="#2dd4bf" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* outer rounded square */}
          <rect width="64" height="64" rx="18" fill="url(#agf-bg)" />
          {/* glow */}
          <circle cx="32" cy="32" r="26" fill="url(#agf-glow)" />

          {/* stem */}
          <motion.path
            d="M32 54V30"
            stroke="#faedcd"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.1 }}
          />
          {/* left leaf */}
          <motion.path
            d="M32 30C24 30 18 25 18 16c8.5 0 14 5 14 14z"
            fill="url(#agf-leaf-l)"
            stroke="#5eead4"
            strokeWidth="1.2"
            initial={{ scale: 0, transformOrigin: '32px 30px' }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4, type: 'spring' }}
          />
          {/* right leaf */}
          <motion.path
            d="M32 30C40 30 46 25 46 16c-8.5 0-14 5-14 14z"
            fill="url(#agf-leaf-r)"
            stroke="#faedcd"
            strokeWidth="1.2"
            initial={{ scale: 0, transformOrigin: '32px 30px' }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.55, type: 'spring' }}
          />
          {/* sprout dot */}
          <motion.circle
            cx="32" cy="30" r="2.4" fill="#faedcd"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          />
        </svg>
        {/* aura behind */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-[18px] blur-xl opacity-70"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(45,212,191,0.55), transparent 70%)',
          }}
        />
      </span>

      {withMark && (
        <span className="font-display font-extrabold tracking-tight text-cream text-lg">
          Agri<span className="text-gradient-mint">Flow</span>
        </span>
      )}
    </motion.span>
  );
}
