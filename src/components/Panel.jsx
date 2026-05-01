import { motion } from 'framer-motion';

export default function Panel({ id, title, action, children, className = '' }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6 }}
      className={`gradient-border overflow-hidden scroll-mt-24 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10">
          <h3 className="font-display font-bold text-cream truncate">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </motion.section>
  );
}
