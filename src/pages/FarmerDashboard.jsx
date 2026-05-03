import { useEffect, useMemo, useState } from 'react';
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
import { api } from '../lib/api.js';
import { productEmoji, stockState, stockLabel, formatRs } from '../lib/productDisplay.js';
import { downloadReceipt } from '../lib/receipt.js';

const sidebarItems = [
  { key: 'home',     label: 'Dashboard',   icon: Home },
  { key: 'market',   label: 'Marketplace', icon: ShoppingCart },
  { key: 'orders',   label: 'My Orders',   icon: Package },
  { key: 'reviews',  label: 'Reviews',     icon: Star },
  { key: 'profile',  label: 'Profile',     icon: User },
  { key: 'settings', label: 'Settings',    icon: Settings },
];

const productToCardShape = (p) => ({
  id: p.product_id,
  emoji: productEmoji(p.category_name),
  name: p.name,
  category: p.category_name || '—',
  rating: 4.5,            // Reviews aggregate not yet wired in /products list
  reviews: 0,
  price: Number(p.unit_price),
  unit: p.unit,
  stockState: stockState(p.quantity),
  stockLabel: stockLabel(p.quantity),
  raw: p,
});

export default function FarmerDashboard() {
  const [active, setActive] = usePersistedState('agf_farmer_tab', 'home');
  const [filter, setFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const refresh = async () => {
    const [prods, ords] = await Promise.all([
      api('/products', { auth: false }),
      api('/orders'),
    ]);
    setProducts(prods);
    setOrders(ords);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [prods, ords] = await Promise.all([
          api('/products', { auth: false }),
          api('/orders'),
        ]);
        if (cancelled) return;
        setProducts(prods);
        setOrders(ords);
      } catch (err) {
        if (!cancelled) toast.error('Could not load data', err.message);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const cards = products.map(productToCardShape);
    if (filter === 'All') return cards;
    return cards.filter((p) => p.category.toLowerCase().startsWith(filter.toLowerCase()));
  }, [products, filter]);

  const cartCount = cart.reduce((n, x) => n + x.qty, 0);
  const cartTotal = cart.reduce((n, x) => n + x.qty * x.price, 0);

  const totalSpent = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled').reduce((n, o) => n + Number(o.total_amount || 0), 0),
    [orders],
  );
  const activeOrdersCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const pendingPayments = orders
    .filter((o) => !o.payment_status || o.payment_status === 'pending')
    .reduce((n, o) => n + Number(o.total_amount || 0), 0);
  // Distinct suppliers whose products this farmer has ordered.
  const suppliersUsed = useMemo(() => {
    const ids = new Set();
    for (const o of orders) {
      for (const item of o.items || []) {
        const prod = products.find((p) => p.product_id === item.product_id);
        if (prod) ids.add(prod.supplier_id);
      }
    }
    return ids.size;
  }, [orders, products]);

  const addToCart = (p) => {
    if (p.stockState === 'out') { toast.error('Out of stock', p.name); return; }
    setCart((prev) => {
      const f = prev.find((x) => x.id === p.id);
      if (f) return prev.map((x) => x.id === p.id ? { ...x, qty: Math.min(x.qty + 1, p.raw.quantity) } : x);
      return [...prev, { ...p, qty: 1 }];
    });
    toast.success('Added to cart', `${p.name} · ${formatRs(p.price)}`);
  };
  const removeFromCart = (id) => { setCart((prev) => prev.filter((x) => x.id !== id)); toast.info('Removed from cart'); };
  const inc = (id) => setCart((p) => p.map((x) => x.id === id ? { ...x, qty: Math.min(x.qty + 1, x.raw.quantity) } : x));
  const dec = (id) => setCart((p) => p.map((x) => x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x));

  const checkout = async () => {
    if (!cart.length) { toast.error('Cart is empty'); return; }
    setPlacing(true);
    try {
      // Backend splits the basket per supplier and returns one order per supplier.
      const placed = await api('/orders', {
        method: 'POST',
        body: {
          delivery_addr: 'Default address — set in profile',
          items: cart.map((c) => ({ product_id: c.id, quantity: c.qty })),
        },
      });
      const orders = Array.isArray(placed) ? placed : [placed];

      let paymentFailures = 0;
      for (const order of orders) {
        try {
          await api('/payments', {
            method: 'POST',
            body: { order_id: order.order_id, method: 'card', amount: order.total_amount },
          });
        } catch {
          paymentFailures += 1;
        }
      }

      const grandTotal = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
      const summary = orders.length === 1
        ? `${formatRs(grandTotal)} · #ORD-${orders[0].order_id}`
        : `${orders.length} orders placed (one per supplier) · ${formatRs(grandTotal)}`;

      if (paymentFailures > 0) {
        toast.info('Order placed; some payments pending', `${paymentFailures} of ${orders.length} need follow-up`);
      } else {
        toast.success('Order placed!', summary);
      }
      setCart([]);
      setCartOpen(false);
      await refresh();
    } catch (err) {
      toast.error('Could not place order', err.message);
    } finally {
      setPlacing(false);
    }
  };

  const notifyMe = (p) => toast.info("We'll notify you", `When ${p.name} is back in stock`);

  const reorder = async (o) => {
    if (!o.items?.length) { toast.info('Re-order saved', `#ORD-${o.order_id}`); return; }
    let added = 0;
    for (const item of o.items) {
      const prod = products.find((p) => p.product_id === item.product_id);
      if (prod && prod.is_active && prod.quantity >= item.quantity) {
        setCart((prev) => {
          const f = prev.find((x) => x.id === prod.product_id);
          if (f) return prev.map((x) => x.id === prod.product_id ? { ...x, qty: x.qty + item.quantity } : x);
          return [...prev, { ...productToCardShape(prod), qty: item.quantity }];
        });
        added += 1;
      }
    }
    if (added > 0) { setCartOpen(true); toast.success(`Re-ordered ${added} item${added === 1 ? '' : 's'}`); }
    else toast.error('Re-order failed', 'Items unavailable or out of stock');
  };

  const viewOrder = (o) => {
    try {
      downloadReceipt(o);
      toast.success('Receipt downloaded', `#ORD-${o.order_id}`);
    } catch (err) {
      toast.error('Could not generate receipt', err.message);
    }
  };

  const HOME_VIEW_TABS = new Set(['home', 'market', 'orders']);

  const handleNav = (k) => {
    setActive(k);
    if (HOME_VIEW_TABS.has(k)) {
      if (k === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else {
        const map = { market: 'panel-marketplace', orders: 'panel-orders' };
        if (map[k]) scrollToPanel(map[k]);
      }
    }
  };

  const isHomeView = HOME_VIEW_TABS.has(active);

  // Reviews tab state
  const [ratingTarget, setRatingTarget] = useState(null);   // { product_id, product_name }
  const [ratingForm, setRatingForm] = useState({ rating: 5, comment: '' });
  useEscapeKey(!!ratingTarget, () => setRatingTarget(null));

  const submitRating = async (e) => {
    e.preventDefault();
    try {
      await api('/reviews', {
        method: 'POST',
        body: { product_id: ratingTarget.product_id, rating: ratingForm.rating, comment: ratingForm.comment || null },
      });
      toast.success('Review submitted', ratingTarget.product_name);
      setRatingTarget(null);
      setRatingForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error('Could not submit review', err.message);
    }
  };

  // Distinct products the farmer has ordered (for the Reviews tab)
  const orderedProducts = useMemo(() => {
    const map = new Map();
    for (const o of orders) {
      for (const item of o.items || []) {
        if (!map.has(item.product_id)) {
          map.set(item.product_id, { product_id: item.product_id, product_name: item.product_name });
        }
      }
    }
    return [...map.values()];
  }, [orders]);

  useEscapeKey(cartOpen, () => setCartOpen(false));

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar
        title={
          active === 'profile' ? 'Your Profile'
          : active === 'reviews' ? 'Reviews'
          : active === 'settings' ? 'Settings'
          : <>Welcome back, <span className="text-gradient-mint">{user?.full_name || 'Farmer'}</span> 👋</>
        }
        subtitle={
          active === 'profile' ? 'Account information on file.'
          : active === 'reviews' ? 'Rate the products you have ordered.'
          : active === 'settings' ? 'Manage your account preferences.'
          : "Here's what's available in the marketplace today."
        }
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

      {isHomeView && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Package} label="Active Orders"    value={activeOrdersCount}                accent="mint"   />
        <StatCard icon={Wallet}  label="Total Spent"      value={totalSpent}      prefix="Rs "     accent="gold"   />
        <StatCard icon={Heart}   label="Suppliers Used"   value={suppliersUsed}                    accent="forest" />
        <StatCard icon={Clock}   label="Pending Payments" value={pendingPayments} prefix="Rs "     accent="red"    />
      </div>
      )}

      {isHomeView && (
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel
          id="panel-marketplace"
          className="lg:col-span-2"
          title="Marketplace — Live Stock"
          action={
            <Select size="sm" value={filter} onChange={setFilter} options={['All', 'Fertilizers', 'Pesticides', 'Seeds', 'Irrigation', 'Farm Tools']} ariaLabel="Filter products by category" className="w-36" />
          }
        >
          <div className="p-5">
            {filtered.length === 0 ? (
              <EmptyState
                title={filter === 'All' ? 'No products in the marketplace yet' : `No ${filter.toLowerCase()} in stock right now`}
                body="Try a different category — fresh stock arrives daily from verified suppliers."
                action={<button onClick={() => setFilter('All')} className="text-mint-300 text-sm font-semibold hover:underline">Show all categories</button>}
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
          action={<button onClick={() => handleNav('orders')} className="text-mint-300 text-sm font-semibold hover:underline">View all</button>}
        >
          {orders.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" body="When you place your first order, you'll see its status here." />
          ) : (
            <ul className="divide-y divide-white/5">
              {orders.slice(0, 6).map((o) => {
                const summary = o.items.length === 1
                  ? `${o.items[0].product_name} × ${o.items[0].quantity} · ${formatRs(o.total_amount)}`
                  : `${o.items.length} items · ${formatRs(o.total_amount)}`;
                return (
                  <li key={o.order_id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <button onClick={() => viewOrder(o)} className="text-left flex-1 hover:opacity-80 transition">
                      <div className="font-semibold text-cream text-sm">#ORD-{o.order_id}</div>
                      <div className="text-xs text-cream/50 mt-0.5">{summary}</div>
                    </button>
                    <div className="flex items-center gap-2">
                      <StatusPill status={o.status} />
                      <button onClick={() => reorder(o)} className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-mint-400/20 text-cream/80 hover:text-mint-200 transition">Reorder</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
      )}

      {active === 'profile' && (
        <Panel title="Account information">
          <div className="p-6 space-y-4 max-w-xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">Full name</div>
                <div className="text-cream font-semibold mt-1">{user?.full_name || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">Role</div>
                <div className="text-cream font-semibold mt-1 capitalize">{user?.role || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">Email</div>
                <div className="text-cream font-semibold mt-1 break-all">{user?.email || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">Phone</div>
                <div className="text-cream font-semibold mt-1">{user?.phone || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">Member since</div>
                <div className="text-cream font-semibold mt-1">{user?.created_at?.slice(0, 10) || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-cream/50">User ID</div>
                <div className="text-cream font-semibold mt-1">#{user?.user_id || '—'}</div>
              </div>
            </div>
            <p className="text-xs text-cream/50 pt-2">To change your details, contact support — self-service profile editing is on the roadmap.</p>
          </div>
        </Panel>
      )}

      {active === 'reviews' && (
        <Panel title="Products you have ordered">
          {orderedProducts.length === 0 ? (
            <EmptyState icon={Star} title="Nothing to review yet" body="Place an order first — you can rate any product you've purchased." />
          ) : (
            <ul className="divide-y divide-white/5">
              {orderedProducts.map((p) => (
                <li key={p.product_id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="font-semibold text-cream text-sm truncate">{p.product_name}</div>
                  <button
                    onClick={() => { setRatingForm({ rating: 5, comment: '' }); setRatingTarget(p); }}
                    className="text-[11px] px-3 py-1.5 rounded-md bg-mint-400/20 text-mint-200 hover:bg-mint-400/30 transition inline-flex items-center gap-1.5"
                  >
                    <Star size={12} /> Rate this
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {active === 'settings' && (
        <Panel title="Account preferences">
          <div className="p-6 space-y-5 max-w-xl">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Signed in as</div>
              <div className="text-cream font-semibold break-all">{user?.email}</div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Notifications</div>
              <label className="flex items-center gap-2 text-cream/80 text-sm">
                <input type="checkbox" defaultChecked className="rounded accent-mint-400" />
                Email me when an order status changes
              </label>
              <label className="flex items-center gap-2 text-cream/80 text-sm mt-2">
                <input type="checkbox" className="rounded accent-mint-400" />
                Email me about new products from suppliers I've used
              </label>
              <p className="text-xs text-cream/50 mt-2">Preferences are stored locally for this demo build.</p>
            </div>
            <div className="border-t border-white/10 pt-5">
              <button
                onClick={() => { localStorage.removeItem('agf_token'); localStorage.removeItem('agf_user'); window.location.href = '/'; }}
                className="px-4 py-2 rounded-xl bg-red-500/15 text-red-200 hover:bg-red-500/25 text-sm font-semibold"
              >
                Sign out everywhere
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Rate-a-product modal */}
      <AnimatePresence>
        {ratingTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4" onClick={() => setRatingTarget(null)}>
            <motion.form
              role="dialog" aria-modal="true" onSubmit={submitRating} onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-md ring-glow relative"
            >
              <button type="button" onClick={() => setRatingTarget(null)} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 className="font-display text-xl font-bold text-cream">Rate product</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5 truncate">{ratingTarget.product_name}</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Rating</label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <button
                        key={n} type="button" onClick={() => setRatingForm((f) => ({ ...f, rating: n }))}
                        aria-label={`${n} star${n === 1 ? '' : 's'}`}
                        className="p-1"
                      >
                        <Star size={28} className={n <= ratingForm.rating ? 'fill-gold-300 text-gold-300' : 'text-cream/30'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Comment (optional)</label>
                  <textarea
                    rows={3} className="input"
                    value={ratingForm.comment}
                    onChange={(e) => setRatingForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="What did you think?"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setRatingTarget(null)} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                  <button type="submit" className="btn-mint px-5 py-2">Submit review</button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} className="fixed inset-0 z-[200] bg-ink/70 backdrop-blur-sm">
            <motion.aside
              role="dialog" aria-modal="true" aria-labelledby="cart-title"
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
                      <div className="text-xs text-cream/50">{formatRs(c.price)} / {c.unit}</div>
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
                  <span className="font-display font-extrabold text-xl">{formatRs(cartTotal)}</span>
                </div>
                <button onClick={checkout} disabled={placing} className="btn-mint w-full disabled:opacity-60">
                  {placing ? 'Placing order…' : 'Place order & pay'}
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </DashShell>
  );
}
