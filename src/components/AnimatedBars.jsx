import { motion } from 'framer-motion';

export default function AnimatedBars({ data = [], heightClass = 'h-56' }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className={`flex gap-2 ${heightClass} pb-2`}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full">
            <div className="flex-1 w-full flex flex-col justify-end">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                className="w-full rounded-t-md bg-gradient-to-t from-mint-600 via-mint-400 to-gold-300 group-hover:from-gold-300 group-hover:to-cream transition-colors shadow-glow-mint"
                style={{ minHeight: 6 }}
              />
            </div>
            <div className="text-[10px] text-cream/50 font-medium">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}
