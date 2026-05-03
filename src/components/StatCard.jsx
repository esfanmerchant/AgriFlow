import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import TiltCard from './three/TiltCard.jsx';

function CountUp({ to = 0, prefix = '', suffix = '', duration = 1.2 }) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    if (from === to) return;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (to - from) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  const display = typeof to === 'number' && to < 100 && to !== Math.floor(to)
    ? val.toFixed(1)
    : Math.floor(val).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

const accentMap = {
  mint:   'from-mint-500/35 to-mint-300/10 text-mint-200',
  forest: 'from-forest-500/35 to-forest-300/10 text-mint-200',
  gold:   'from-gold-400/35 to-gold-300/10 text-gold-200',
  blue:   'from-blue-500/35 to-blue-400/10 text-blue-200',
  red:    'from-red-500/35 to-red-400/10 text-red-200',
};

export default function StatCard({ icon: Icon, label, value, prefix, suffix, trend, accent = 'mint' }) {
  return (
    <TiltCard>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="gradient-border p-5 lift relative overflow-hidden"
      >
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl bg-gradient-to-br ${accentMap[accent]} opacity-70`} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-cream/50">{label}</div>
            <div className="font-display text-3xl font-extrabold text-cream mt-1">
              {typeof value === 'number'
                ? <CountUp to={value} prefix={prefix} suffix={suffix} />
                : <span>{prefix}{value}{suffix}</span>}
            </div>
            {trend && (
              <div className={`text-xs mt-2 font-semibold ${trend.up ? 'text-mint-300' : 'text-red-300'}`}>
                {trend.up ? '▲' : '▼'} {trend.text}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br ${accentMap[accent]}`}>
              <Icon size={20} />
            </div>
          )}
        </div>
      </motion.div>
    </TiltCard>
  );
}
