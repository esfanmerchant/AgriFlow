import { useMemo, useState } from 'react';
import usePersistedState from '../lib/usePersistedState.js';
import useEscapeKey from '../lib/useEscapeKey.js';
import { scrollToPanel } from '../lib/scrollToPanel.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingCart, Package, Star, User, Settings, Wallet, Heart, Clock, X, Plus, Minus, Trash2 } from 'lucide-react';
import DashShell from '../components/DashShell.jsx';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Panel from '../components/Panel.jsx';
import ProductCard from '../components/ProductCard.jsx';
import StatusPill from '../components/StatusPill.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Select from '../components/Select.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const sidebarItems = [
  { key: 'home',     label: 'Dashboard',   icon: Home },
  { key: 'market',   label: 'Marketplace', icon: ShoppingCart },
  { key: 'orders',   label: 'My Orders',   icon: Package },
  { key: 'reviews',  label: 'Reviews',     icon: Star },
  { key: 'profile',  label: 'Profile',     icon: User },
  { key: 'settings', label: 'Settings',    icon: Settings },
];

const initialProducts = [
  { id: 1, emoji: '🌾', name: 'Urea (46% N) — 50kg',   category: 'Fertilizers · Nitrogen', rating: 4.8, reviews: 124, price: 4200,  unit: 'bag',   stockState: 'in',  stockLabel: '248 in stock' },
  { id: 2, emoji: '🌱', name: 'DAP Fertilizer — 50kg', category: 'Fertilizers · Phosphate', rating: 4.3, reviews: 86,  price: 11500, unit: 'bag',   stockState: 'low', stockLabel: '12 left' },
  { id: 3, emoji: '🌿', name: 'Compost Mix — 25kg',    category: 'Fertilizers · Organic',   rating: 4.9, reviews: 210, price: 1800,  unit: 'bag',   stockState: 'in',  stockLabel: '120 in stock' },
  { id: 4, emoji: '🌽', name: 'Hybrid Maize Seed — 5kg',category: 'Seeds · Hybrid',          rating: 4.4, reviews: 47,  price: 3200,  unit: 'pack',  stockState: 'in',  stockLabel: '450 in stock' },
  { id: 5, emoji: '🧪', name: 'Insecticide Spray — 1L', category: 'Pesticides',              rating: 4.1, reviews: 33,  price: 950,   unit: 'bottle',stockState:'out',  stockLabel: 'Out of stock' },
  { id: 6, emoji: '💧', name: 'Drip Tape — 100m',      category: 'Irrigation',              rating: 4.7, reviews: 65,  price: 2400,  unit: 'roll',  stockState: 'in',  stockLabel: '68 in stock' },
];

const initialOrders = [
  { id: '#ORD-1042', desc: 'Urea × 4 · Rs 16,800',     status: 'delivered' },
  { id: '#ORD-1041', desc: 'DAP × 2 · Rs 23,000',      status: 'shipped'   },
  { id: '#ORD-1039', desc: 'Compost × 6 · Rs 10,800',  status: 'confirmed' },
  { id: '#ORD-1037', desc: 'Maize seed × 3 · Rs 9,600',status: 'pending'   },
  { id: '#ORD-1031', desc: 'Drip tape × 1 · Rs 2,400', status: 'cancelled' },
];

export default function FarmerDashboard() {
  const [active, setActive] = usePersistedState('agf_farmer_tab', 'home');
  const [filter, setFilter] = useState('All');
  const [cart, setCart]   = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders] = useState(initialOrders);
  const { user } = useAuth();
  const toast = useToast();

  const filtered = useMemo(() => {
    if (filter === 'All') return initialProducts;
    return initialProducts.filter((p) => p.category.toLowerCase().startsWith(filter.toLowerCase()));
  }, [filter]);

  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotal = cart.reduce((n, x) => n + x.qty * x.price, 0);

  const addToCart = (p) => {
    setCart((prev) => {
      const f = prev.find((x) => x.id === p.id);
      if (f) return prev.map((x) => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });
    toast.success('Added to cart', `${p.name} · Rs ${p.price.toLocaleString()}`);
  };
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
    toast.info('Removed from cart');
  };
  const inc = (id) => setCart((p) => p.map((x) => x.id === id ? { ...x, qty: x.qty + 1 } : x));
  const dec = (id) => setCart((p) => p.map((x) => x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x));

  const checkout = () => {
    if (!cart.length) { toast.error('Cart is empty'); return; }
    toast.success('Order placed!', `Rs ${cartTotal.toLocaleString()} · Transaction COMMIT successful`);
    setCart([]);
    setCartOpen(false);
  };

  const notifyMe = (p) => toast.info('We\'ll notify you', `When ${p.name} is back in stock`);

  // Re-order: try to find the original product in the catalog by id from
  // order desc; fall back to a friendly toast if we can't match.
  const reorder = (o) => {
    const match = initialProducts.find((p) => o.desc.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]));
    if (match) {
      addToCart(match);
      setCartOpen(true);
    } else {
      toast.info('Re-order saved', `${o.id} added to your draft cart`);
    }
  };
  const viewOrder = (o) => toast.info(o.id, `${o.desc} · status: ${o.status}`);

  // Sidebar tab → scroll to the matching panel on the page.
  const handleNav = (k) => {
    setActive(k);
    if (k === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const map = { market: 'panel-marketplace', orders: 'panel-orders' };
    if (map[k]) scrollToPanel(map[k]);
    else toast.info('Coming soon', `${k} view will be wired up after backend integration`);
  };

  // Cart drawer: close on Escape
  useEscapeKey(cartOpen, () => setCartOpen(false));

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar
        title={<>Welcome back, <span className="text-gradient-mint">{user?.name || 'Farmer'}</span> 👋</>}
        subtitle="Here's what's available in the marketplace today."
        action={
          <button
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart${cartCount > 0 ? ` (${cartCount} item${cartCount === 1 ? '' : 's'})` : ''}`}
            className="relative w-10 h-10 grid place-items-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-cream transition"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-mint-400 text-ink text-[11px] font-bold grid place-items-center" aria-hidden="true">
                {cartCount}
              </span>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Active Orders"     value={4}     trend={{ up: true,  text: '2 since last week' }} accent="mint"   />
        <StatCard icon={Wallet}  label="Total Spent"       value={84200} prefix="Rs " trend={{ up: true,  text: '12% this month' }}    accent="gold"   />
        <StatCard icon={Heart}   label="Saved Suppliers"   value={12}    trend={{ up: true,  text: '3 new this week' }}    accent="forest" />
        <StatCard icon={Clock}   label="Pending Payments"  value={11500} prefix="Rs " trend={{ up: false, text: '1 invoice due' }}    accent="red"    />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel
          id="panel-marketplace"
          className="lg:col-span-2"
          title="Marketplace — Live Stock"
          action={
            <Select
              size="sm"
              value={filter}
              onChange={setFilter}
              options={['All', 'Fertilizers', 'Pesticides', 'Seeds', 'Irrigation']}
              ariaLabel="Filter products by category"
              className="w-36"
            />
          }
        >
          <div className="p-5">
            {filtered.length === 0 ? (
              <EmptyState
                title={`No ${filter.toLowerCase()} in stock right now`}
                body="Try a different category — fresh stock arrives daily from verified suppliers."
                action={(
                  <button
                    onClick={() => setFilter('All')}
                    className="text-mint-300 text-sm font-semibold hover:underline"
                  >
                    Show all categories
                  </button>
                )}
              />
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    p={p}
                    idx={i}
                    onAdd={addToCart}
                    onNotify={notifyMe}
                    onFavorite={(prod, fav) => fav && toast.info('Saved to favorites', prod.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel
          id="panel-orders"
          title="Recent Orders"
          action={<button onClick={() => toast.info('Coming soon', 'Full order list')} className="text-mint-300 text-sm font-semibold hover:underline">View all</button>}
        >
          {orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders yet"
              body="When you place your first order, you'll see its status here."
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {orders.map((o) => (
                <li key={o.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <button onClick={() => viewOrder(o)} className="text-left flex-1 hover:opacity-80 transition">
                    <div className="font-semibold text-cream text-sm">{o.id}</div>
                    <div className="text-xs text-cream/50 mt-0.5">{o.desc}</div>
                  </button>
                  <div className="flex items-center gap-2">
                    <StatusPill status={o.status} />
                    <button
                      onClick={() => reorder(o)}
                      className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-mint-400/20 text-cream/80 hover:text-mint-200 transition"
                    >Reorder</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 z-[200] bg-ink/70 backdrop-blur-sm"
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="cart-title"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-ink/95 border-l border-white/10 flex flex-col"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <div id="cart-title" className="font-display font-bold text-cream">Your Cart</div>
                  <div className="text-xs text-cream/50">{cartCount} item{cartCount === 1 ? '' : 's'}</div>
                </div>
                <button onClick={() => setCartOpen(false)} aria-label="Close cart" className="w-9 h-9 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-cream"><X size={16} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center text-cream/50 mt-20">
                    <ShoppingCart size={36} className="mx-auto mb-3 opacity-40" />
                    Your cart is empty.
                  </div>
                ) : cart.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-2xl">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-cream text-sm truncate">{c.name}</div>
                      <div className="text-xs text-cream/50">Rs {c.price.toLocaleString()} / {c.unit}</div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <button onClick={() => dec(c.id)} className="w-6 h-6 grid place-items-center rounded-md bg-white/5 hover:bg-white/10 text-cream"><Minus size={12} /></button>
                        <span className="w-7 text-center text-sm text-cream font-semibold">{c.qty}</span>
                        <button onClick={() => inc(c.id)} className="w-6 h-6 grid place-items-center rounded-md bg-white/5 hover:bg-white/10 text-cream"><Plus size={12} /></button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(c.id)} className="w-8 h-8 grid place-items-center rounded-lg text-red-300 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t border-white/10">
                <div className="flex justify-between text-cream mb-3">
                  <span className="text-cream/60 text-sm">Total</span>
                  <span className="font-display font-extrabold text-xl">Rs {cartTotal.toLocaleString()}</span>
                </div>
                <button onClick={checkout} className="btn-mint w-full">
                  Place order (COMMIT)
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </DashShell>
  );
}
