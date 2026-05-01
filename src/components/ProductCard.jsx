import { motion } from 'framer-motion';
import { ShoppingCart, Star, Bell, Heart } from 'lucide-react';
import { useState } from 'react';
import TiltCard from './three/TiltCard.jsx';

export default function ProductCard({ p, idx = 0, onAdd, onNotify, onFavorite }) {
  const [fav, setFav] = useState(false);

  const stockClass =
    p.stockState === 'out' ? 'text-red-300 bg-red-500/10' :
    p.stockState === 'low' ? 'text-gold-300 bg-gold-300/10' :
                              'text-mint-300 bg-mint-400/10';

  const toggleFav = () => { setFav(!fav); onFavorite && onFavorite(p, !fav); };
  const handlePrimary = () => {
    if (p.stockState === 'out') onNotify && onNotify(p);
    else onAdd && onAdd(p);
  };

  return (
    <TiltCard>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: idx * 0.04 }}
        className="gradient-border overflow-hidden lift"
      >
        <div className="relative h-40 bg-gradient-to-br from-mint-300/40 via-mint-500/20 to-forest-700/40 grid place-items-center">
          <div className="text-6xl drop-shadow-[0_4px_18px_rgba(45,212,191,0.6)]">{p.emoji}</div>
          <span className={`absolute top-3 right-3 pill ${stockClass}`}>{p.stockLabel}</span>
          <button
            onClick={toggleFav}
            className={`absolute top-3 left-3 w-8 h-8 grid place-items-center rounded-full backdrop-blur-md transition ${
              fav ? 'bg-mint-400/30 text-mint-200' : 'bg-white/10 text-cream/70 hover:text-mint-300'
            }`}
            aria-label={fav ? 'Remove from favorites' : 'Save to favorites'}
            aria-pressed={fav}
          >
            <Heart size={14} fill={fav ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-cream/50">{p.category}</div>
          <h4 className="font-semibold text-cream mt-1">{p.name}</h4>
          <div className="flex items-center gap-1 mt-1 text-gold-300 text-sm">
            <Star size={14} fill="currentColor" />
            <span>{p.rating}</span>
            <span className="text-cream/40 text-xs">({p.reviews})</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="font-display text-lg font-extrabold text-cream">Rs {p.price.toLocaleString()}</div>
              <div className="text-xs text-cream/50">/ {p.unit}</div>
            </div>
            <button
              onClick={handlePrimary}
              aria-label={p.stockState === 'out' ? `Notify me when ${p.name} is back in stock` : `Add ${p.name} to cart`}
              className="px-3 py-2 rounded-xl text-ink font-semibold text-sm transition inline-flex items-center gap-1.5 active:scale-95"
              style={{ background: p.stockState === 'out'
                ? 'linear-gradient(135deg,#fde68a,#f59e0b)'
                : 'linear-gradient(135deg,#5eead4,#2dd4bf 50%,#0d9488)' }}
            >
              {p.stockState === 'out' ? <Bell size={14} /> : <ShoppingCart size={14} />}
              {p.stockState === 'out' ? 'Notify' : 'Add'}
            </button>
          </div>
        </div>
      </motion.article>
    </TiltCard>
  );
}
