import { useEffect, useMemo, useState } from 'react';
import usePersistedState from '../lib/usePersistedState.js';
import useEscapeKey from '../lib/useEscapeKey.js';
import { scrollToPanel } from '../lib/scrollToPanel.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Boxes, Package, BarChart3, Star, Settings, Building2,
  Wallet, AlertTriangle, Plus, X, CheckCircle2, Truck, MapPin, FileText,
  Pencil, Trash2, Save, RotateCcw, Ban,
} from 'lucide-react';
import DashShell from '../components/DashShell.jsx';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Panel from '../components/Panel.jsx';
import StatusPill from '../components/StatusPill.jsx';
import Select from '../components/Select.jsx';
import AnimatedBars from '../components/AnimatedBars.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { api, ApiError } from '../lib/api.js';
import { productEmoji, formatRs } from '../lib/productDisplay.js';
import { downloadReceipt } from '../lib/receipt.js';

const sidebarItems = [
  { key: 'home',      label: 'Overview',        icon: Home },
  { key: 'inventory', label: 'Inventory',       icon: Boxes },
  { key: 'orders',    label: 'Orders',          icon: Package },
  { key: 'sales',     label: 'Sales Analytics', icon: BarChart3 },
  { key: 'reviews',   label: 'Reviews',         icon: Star },
  { key: 'company',   label: 'Company',         icon: Building2 },
  { key: 'settings',  label: 'Settings',        icon: Settings },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Build 12 weekly buckets ending in the current week. Mode controls what we count:
// 'Revenue' sums my line totals, 'Orders' counts distinct orders, 'Units' sums quantities.
function buildSalesWeeks(orders, myProductIds, mode) {
  const now = new Date();
  // Anchor to start of current week (Monday) for cleaner buckets.
  const anchor = new Date(now);
  anchor.setHours(0, 0, 0, 0);
  const dow = (anchor.getDay() + 6) % 7; // Mon=0..Sun=6
  anchor.setDate(anchor.getDate() - dow);
  const buckets = Array.from({ length: 12 }, (_, idx) => ({
    label: `W${idx + 1}`,
    start: new Date(anchor.getTime() - (11 - idx) * WEEK_MS),
    value: 0,
    orderIds: new Set(),
  }));
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const t = o.ordered_at ? new Date(o.ordered_at).getTime() : NaN;
    if (!Number.isFinite(t)) continue;
    const idx = Math.floor((t - buckets[0].start.getTime()) / WEEK_MS);
    if (idx < 0 || idx > 11) continue;
    const b = buckets[idx];
    const mineLines = (o.items || []).filter((i) => myProductIds.has(i.product_id));
    if (mineLines.length === 0) continue;
    if (mode === 'Revenue') {
      b.value += mineLines.reduce((s, i) => s + Number(i.line_total || 0), 0);
    } else if (mode === 'Units') {
      b.value += mineLines.reduce((s, i) => s + Number(i.quantity || 0), 0);
    } else {
      b.orderIds.add(o.order_id);
    }
  }
  if (mode === 'Orders') {
    for (const b of buckets) b.value = b.orderIds.size;
  }
  return buckets.map(({ label, value }) => ({ label, value: Math.round(value) }));
}

const nextStatus = {
  pending:   { next: 'confirmed', label: 'Confirm', icon: CheckCircle2 },
  confirmed: { next: 'shipped',   label: 'Ship',    icon: Truck },
  shipped:   { next: 'delivered', label: 'Mark delivered', icon: MapPin },
  delivered: { next: 'delivered', label: 'Receipt', icon: FileText },
  cancelled: { next: 'cancelled', label: 'Details', icon: FileText },
};

export default function SupplierDashboard() {
  const [active, setActive] = usePersistedState('agf_supplier_tab', 'home');
  const [modalOpen, setModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [supplier, setSupplier] = useState(null);
  const [supplierLoading, setSupplierLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [chartMode, setChartMode] = useState('Revenue');
  const [form, setForm] = useState({ name: '', category_id: '', price: '', stock: '', desc: '' });
  const [profileForm, setProfileForm] = useState({ company_name: '', gst_number: '', address: '' });
  const { user } = useAuth();
  const toast = useToast();

  // Load supplier profile, then products/orders/categories.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api('/suppliers/me');
        if (cancelled) return;
        setSupplier(me);
        await Promise.all([
          api('/products/mine').then((d) => !cancelled && setProducts(d)),
          api('/orders').then((d) => !cancelled && setOrders(d)),
          api('/categories', { auth: false }).then((d) => !cancelled && setCategories(d)),
        ]);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setProfileOpen(true);
        } else {
          toast.error('Could not load dashboard', err.message);
        }
      } finally {
        if (!cancelled) setSupplierLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleOrders = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter((o) => o.status === statusFilter.toLowerCase());
  }, [orders, statusFilter]);

  const myProductIds = useMemo(
    () => new Set(products.map((p) => p.product_id)),
    [products],
  );

  // Orders are scoped to those containing my products, but a single order
  // may also include another supplier's items. Sum only my line_totals.
  const totalRevenue = useMemo(
    () => orders
      .filter((o) => o.status === 'delivered')
      .reduce((sum, o) => {
        const mine = o.items.filter((i) => myProductIds.has(i.product_id));
        return sum + mine.reduce((s, i) => s + Number(i.line_total || 0), 0);
      }, 0),
    [orders, myProductIds],
  );
  // "Pending" here means "not yet delivered/cancelled" — pending + confirmed + shipped.
  const pendingCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const lowStockCount = products.filter((p) => p.is_active && p.quantity > 0 && p.quantity <= (p.reorder_level || 10)).length;

  const [cancelTarget, setCancelTarget] = useState(null);
  useEscapeKey(!!cancelTarget, () => setCancelTarget(null));

  const cancelOrder = async () => {
    if (!cancelTarget) return;
    try {
      const updated = await api(`/orders/${cancelTarget.order_id}/status`, {
        method: 'PATCH',
        body: { status: 'cancelled' },
      });
      setOrders((prev) => prev.map((x) => x.order_id === updated.order_id ? updated : x));
      toast.success(`#ORD-${updated.order_id} cancelled`, 'Stock has been restored');
      setCancelTarget(null);
    } catch (err) {
      toast.error('Could not cancel order', err.message);
    }
  };

  const advance = async (o) => {
    const flow = nextStatus[o.status];
    // Terminal states (delivered/cancelled) — emit a PDF receipt.
    if (flow && flow.next === o.status) {
      try {
        downloadReceipt(o, { partyLabel: 'SHIP TO' });
        toast.success('Receipt downloaded', `#ORD-${o.order_id}`);
      } catch (err) {
        toast.error('Could not generate receipt', err.message);
      }
      return;
    }
    if (!flow) {
      toast.info('Order', `#ORD-${o.order_id}`);
      return;
    }
    try {
      const updated = await api(`/orders/${o.order_id}/status`, {
        method: 'PATCH',
        body: { status: flow.next },
      });
      setOrders((prev) => prev.map((x) => x.order_id === o.order_id ? updated : x));
      toast.success(`#ORD-${o.order_id} → ${flow.next}`, o.farmer_name || '');
    } catch (err) {
      toast.error('Status update failed', err.message);
    }
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.company_name.trim() || !profileForm.address.trim()) {
      toast.error('Missing fields', 'Company name and address are required');
      return;
    }
    try {
      const created = await api('/suppliers', { method: 'POST', body: profileForm });
      setSupplier(created);
      setProfileOpen(false);
      toast.success('Profile created', created.company_name);
      const [mine, ords, cats] = await Promise.all([
        api('/products/mine'),
        api('/orders'),
        api('/categories', { auth: false }),
      ]);
      setProducts(mine);
      setOrders(ords);
      setCategories(cats);
    } catch (err) {
      toast.error('Could not create profile', err.message);
    }
  };

  const resetForm = () => setForm({ name: '', category_id: categories[0]?.category_id ?? '', price: '', stock: '', desc: '' });
  const openAddProduct = () => { resetForm(); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); resetForm(); };

  const submitProduct = async (e) => {
    e.preventDefault();
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    if (!form.name.trim()) { toast.error('Missing field', 'Product name is required'); return; }
    if (!form.category_id) { toast.error('Missing category', 'Pick a category'); return; }
    if (!Number.isFinite(priceNum) || priceNum <= 0) { toast.error('Invalid price', 'Enter a price greater than 0'); return; }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      toast.error('Invalid stock', 'Enter a non-negative integer');
      return;
    }
    try {
      const created = await api('/products', {
        method: 'POST',
        body: {
          category_id: Number(form.category_id),
          name: form.name.trim(),
          description: form.desc || null,
          unit_price: priceNum,
          unit: 'bag',
          initial_quantity: stockNum,
        },
      });
      setProducts((prev) => [created, ...prev]);
      toast.success('Product added', `${created.name} · ${formatRs(created.unit_price)}`);
      closeModal();
    } catch (err) {
      toast.error('Could not add product', err.message);
    }
  };

  const HOME_VIEW_TABS = new Set(['home', 'orders']);

  const handleNav = (k) => {
    setActive(k);
    if (HOME_VIEW_TABS.has(k)) {
      if (k === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else {
        const map = { orders: 'panel-orders' };
        if (map[k]) scrollToPanel(map[k]);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isHomeView = HOME_VIEW_TABS.has(active);

  // Company-edit state
  const [companyForm, setCompanyForm] = useState({ company_name: '', gst_number: '', address: '' });
  useEffect(() => {
    if (supplier) {
      setCompanyForm({
        company_name: supplier.company_name || '',
        gst_number: supplier.gst_number || '',
        address: supplier.address || '',
      });
    }
  }, [supplier]);

  const saveCompany = async (e) => {
    e.preventDefault();
    try {
      const updated = await api('/suppliers/me', { method: 'PATCH', body: companyForm });
      setSupplier(updated);
      toast.success('Profile updated', updated.company_name);
    } catch (err) {
      toast.error('Could not update profile', err.message);
    }
  };

  // Inventory tab — inline edit per product
  const [editingProduct, setEditingProduct] = useState(null); // { product_id, unit_price, quantity }
  const [savingProduct, setSavingProduct] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const startEditProduct = (p) => setEditingProduct({
    product_id: p.product_id,
    unit_price: String(p.unit_price ?? ''),
    quantity: String(p.quantity ?? 0),
  });
  const cancelEditProduct = () => setEditingProduct(null);

  const saveEditProduct = async () => {
    if (!editingProduct) return;
    const priceNum = Number(editingProduct.unit_price);
    const qtyNum = Number(editingProduct.quantity);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error('Invalid price', 'Enter a price greater than 0');
      return;
    }
    if (!Number.isFinite(qtyNum) || qtyNum < 0 || !Number.isInteger(qtyNum)) {
      toast.error('Invalid quantity', 'Enter a non-negative integer');
      return;
    }
    setSavingProduct(true);
    try {
      const updated = await api(`/products/${editingProduct.product_id}`, {
        method: 'PATCH',
        body: { unit_price: priceNum, quantity: qtyNum },
      });
      setProducts((prev) => prev.map((x) => x.product_id === updated.product_id ? updated : x));
      toast.success('Product updated', updated.name);
      setEditingProduct(null);
    } catch (err) {
      toast.error('Could not update product', err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const removeProduct = async () => {
    if (!confirmRemove) return;
    try {
      await api(`/products/${confirmRemove.product_id}`, { method: 'DELETE' });
      setProducts((prev) => prev.map((p) => p.product_id === confirmRemove.product_id ? { ...p, is_active: false } : p));
      toast.success('Product removed', `${confirmRemove.name} is no longer listed`);
      setConfirmRemove(null);
    } catch (err) {
      toast.error('Could not remove product', err.message);
    }
  };

  const reactivateProduct = async (p) => {
    try {
      const updated = await api(`/products/${p.product_id}`, { method: 'PATCH', body: { is_active: true } });
      setProducts((prev) => prev.map((x) => x.product_id === updated.product_id ? updated : x));
      toast.success('Product re-listed', updated.name);
    } catch (err) {
      toast.error('Could not re-list product', err.message);
    }
  };

  useEscapeKey(!!editingProduct, cancelEditProduct);
  useEscapeKey(!!confirmRemove, () => setConfirmRemove(null));

  // Reviews tab — fetch reviews per product on demand
  const [productReviews, setProductReviews] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  useEffect(() => {
    if (active !== 'reviews' || products.length === 0) return;
    let cancelled = false;
    setReviewsLoading(true);
    (async () => {
      try {
        const entries = await Promise.all(
          products.map(async (p) => {
            const list = await api(`/products/${p.product_id}/reviews`, { auth: false }).catch(() => []);
            return [p.product_id, list];
          }),
        );
        if (!cancelled) setProductReviews(Object.fromEntries(entries));
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [active, products]);

  useEscapeKey(modalOpen, closeModal);

  const salesWeeks = useMemo(
    () => buildSalesWeeks(orders, myProductIds, chartMode),
    [orders, myProductIds, chartMode],
  );

  const topProducts = useMemo(() => {
    const soldByProduct = new Map();
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      for (const item of o.items || []) {
        if (!myProductIds.has(item.product_id)) continue;
        soldByProduct.set(
          item.product_id,
          (soldByProduct.get(item.product_id) || 0) + item.quantity,
        );
      }
    }
    return [...products]
      .map((p) => ({ ...p, sold: soldByProduct.get(p.product_id) || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4);
  }, [products, orders, myProductIds]);

  if (supplierLoading) {
    return (
      <DashShell sidebarItems={sidebarItems} active="home" onSelect={() => {}}>
        <div className="text-cream/60 text-sm p-6">Loading…</div>
      </DashShell>
    );
  }

  if (profileOpen || !supplier) {
    return (
      <DashShell sidebarItems={sidebarItems} active="company" onSelect={() => {}}>
        <Topbar title="Complete your supplier profile" subtitle="One-time setup so farmers can find you and you can list products." />
        <Panel title="Company details">
          <form onSubmit={submitProfile} className="p-5 space-y-4 max-w-xl">
            <div>
              <label className="label">Company name</label>
              <input className="input" value={profileForm.company_name} onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })} placeholder="GreenFields Co." required />
            </div>
            <div>
              <label className="label">GST number (optional)</label>
              <input className="input" value={profileForm.gst_number} onChange={(e) => setProfileForm({ ...profileForm, gst_number: e.target.value })} placeholder="GST-1234" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Lahore, PK" required />
            </div>
            <button type="submit" className="btn-mint px-5 py-2">Create profile</button>
          </form>
        </Panel>
      </DashShell>
    );
  }

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar
        title={
          active === 'reviews' ? 'Customer Reviews'
          : active === 'company' ? 'Company Profile'
          : active === 'settings' ? 'Settings'
          : active === 'inventory' ? 'Inventory'
          : active === 'sales' ? 'Sales Analytics'
          : 'Supplier Overview'
        }
        subtitle={
          active === 'reviews' ? 'Feedback from farmers on your products.'
          : active === 'company' ? 'Update the details farmers see when browsing.'
          : active === 'settings' ? 'Manage your account preferences.'
          : active === 'inventory' ? 'Manage prices, stock, and listings for your products.'
          : active === 'sales' ? 'Trend lines and top performers across your catalogue.'
          : <>Hi <span className="text-mint-300 font-semibold">{user?.full_name || supplier.company_name}</span> — here&apos;s how your business is performing.</>
        }
        action={
          (isHomeView || active === 'inventory') ? (
            <button onClick={openAddProduct} className="px-4 py-2 rounded-xl shimmer text-cream font-semibold text-sm inline-flex items-center gap-2 active:scale-95 transition">
              <Plus size={16} /> Add Product
            </button>
          ) : null
        }
      />

      {isHomeView && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet}        label="Total Revenue (delivered)" value={totalRevenue} prefix="Rs "                                                accent="mint"   />
        <StatCard icon={Package}       label="Pending Orders"            value={pendingCount}                                                              accent="gold"   />
        <StatCard icon={Boxes}         label="Products Listed"           value={products.filter((p) => p.is_active).length}                                accent="forest" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts"          value={lowStockCount} trend={lowStockCount ? { up: false, text: 'Needs reorder' } : undefined} accent="red" />
      </div>
      )}

      {isHomeView && (
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel
          id="panel-sales"
          title="Sales Trend"
          className="lg:col-span-2"
          action={
            <Select size="sm" value={chartMode} onChange={(v) => { setChartMode(v); toast.info('Chart updated', v); }} options={['Revenue', 'Orders', 'Units']} ariaLabel="Sales chart mode" className="w-32" />
          }
        >
          <div className="px-5 pt-4 text-xs text-cream/50">{chartMode} · last 12 weeks (demo data)</div>
          <div className="px-5"><AnimatedBars data={salesWeeks} /></div>
        </Panel>

        <Panel title="Top Products" action={<button onClick={() => handleNav('sales')} className="text-mint-300 text-sm font-semibold hover:underline">Full report</button>}>
          {topProducts.length === 0 ? (
            <EmptyState title="No products yet" body="Add your first product to start selling." />
          ) : (
            <ul>
              {topProducts.map((p, i) => (
                <li key={p.product_id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== topProducts.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-xl">{productEmoji(p.category_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-cream text-sm truncate">{p.name}</div>
                    <div className="text-xs text-cream/50">{p.sold} sold · {p.quantity} in stock</div>
                  </div>
                  <div className={`font-bold ${p.sold > 0 ? 'text-mint-300' : 'text-cream/40'}`}>{p.sold > 0 ? '↑' : '–'}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      )}

      {isHomeView && (
      <Panel
        id="panel-orders"
        title="Incoming Orders"
        action={
          <div className="flex gap-1.5 text-xs">
            {['All', 'Pending', 'Confirmed', 'Shipped'].map((b) => (
              <button key={b} onClick={() => setStatusFilter(b)} className={`px-3 py-1.5 rounded-lg transition ${statusFilter === b ? 'bg-mint-400/20 text-mint-200' : 'bg-white/5 hover:bg-white/10 text-cream/70'}`}>{b}</button>
            ))}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-5 py-3">Farmer</th>
                <th className="text-left px-5 py-3">Items</th>
                <th className="text-left px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-cream/50 py-10">No orders match this filter.</td></tr>
              ) : visibleOrders.map((o) => {
                const flow = nextStatus[o.status] || nextStatus.pending;
                const Icon = flow.icon;
                const itemSummary = o.items.length === 1
                  ? `${o.items[0].product_name} × ${o.items[0].quantity}`
                  : `${o.items.length} items`;
                return (
                  <tr key={o.order_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3 font-semibold text-cream">#ORD-{o.order_id}</td>
                    <td className="px-5 py-3 text-cream/80">{o.farmer_name}</td>
                    <td className="px-5 py-3 text-cream/80">{itemSummary}</td>
                    <td className="px-5 py-3 text-cream/80">{formatRs(o.total_amount)}</td>
                    <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-5 py-3">
                      <div className="inline-flex gap-1.5">
                        <button
                          onClick={() => advance(o)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition"
                          style={{ background: 'linear-gradient(135deg,#5eead4,#2dd4bf 50%,#0d9488)', color: '#06120c' }}
                        >
                          <Icon size={13} /> {flow.label}
                        </button>
                        {(o.status === 'pending' || o.status === 'confirmed') && (
                          <button
                            onClick={() => setCancelTarget(o)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-red-500/15 text-red-200 hover:bg-red-500/25 active:scale-95 transition"
                          >
                            <Ban size={13} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      )}

      {active === 'inventory' && (
        <Panel
          title={`My products (${products.length})`}
          action={
            <div className="text-xs text-cream/50">
              {products.filter((p) => p.is_active).length} active · {products.filter((p) => p.is_active && p.quantity > 0 && p.quantity <= (p.reorder_level || 10)).length} low stock
            </div>
          }
        >
          {products.length === 0 ? (
            <EmptyState icon={Boxes} title="No products yet" body="Click Add Product to list your first item." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                    <th className="text-left px-5 py-3">Product</th>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Stock</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isEditing = editingProduct?.product_id === p.product_id;
                    const lowStock = p.is_active && p.quantity > 0 && p.quantity <= (p.reorder_level || 10);
                    const oos = p.is_active && p.quantity <= 0;
                    return (
                      <tr key={p.product_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-lg shrink-0">{productEmoji(p.category_name)}</div>
                            <div className="min-w-0">
                              <div className="font-semibold text-cream truncate">{p.name}</div>
                              <div className="text-[11px] text-cream/50">/ {p.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-cream/70">{p.category_name || '—'}</td>
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <input
                              type="number" min="1" step="any" inputMode="decimal"
                              className="input !py-1.5 !px-2 w-28 text-sm"
                              value={editingProduct.unit_price}
                              onChange={(e) => setEditingProduct({ ...editingProduct, unit_price: e.target.value })}
                            />
                          ) : (
                            <span className="text-cream/80">{formatRs(p.unit_price)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <input
                              type="number" min="0" step="1" inputMode="numeric"
                              className="input !py-1.5 !px-2 w-24 text-sm"
                              value={editingProduct.quantity}
                              onChange={(e) => setEditingProduct({ ...editingProduct, quantity: e.target.value })}
                            />
                          ) : (
                            <span className={oos ? 'text-red-300' : lowStock ? 'text-gold-300' : 'text-cream/80'}>
                              {p.quantity}
                              {lowStock && <span className="ml-1 text-[10px] uppercase tracking-wider text-gold-300/80">low</span>}
                              {oos && <span className="ml-1 text-[10px] uppercase tracking-wider text-red-300/80">out</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill status={p.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={saveEditProduct}
                                disabled={savingProduct}
                                className="px-2.5 py-1 rounded-lg bg-mint-400/20 text-mint-200 hover:bg-mint-400/30 text-xs inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <Save size={12} /> {savingProduct ? 'Saving…' : 'Save'}
                              </button>
                              <button onClick={cancelEditProduct} className="px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs">
                                Cancel
                              </button>
                            </div>
                          ) : p.is_active ? (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs inline-flex items-center gap-1"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                onClick={() => setConfirmRemove(p)}
                                className="px-2.5 py-1 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 text-xs inline-flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => reactivateProduct(p)}
                              className="px-2.5 py-1 rounded-lg text-mint-200 hover:bg-mint-400/20 text-xs inline-flex items-center gap-1"
                            >
                              <RotateCcw size={12} /> Re-list
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {active === 'sales' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Panel
            title="Sales Trend"
            className="lg:col-span-2"
            action={
              <Select size="sm" value={chartMode} onChange={(v) => { setChartMode(v); toast.info('Chart updated', v); }} options={['Revenue', 'Orders', 'Units']} ariaLabel="Sales chart mode" className="w-32" />
            }
          >
            <div className="px-5 pt-4 text-xs text-cream/50">{chartMode} · last 12 weeks (demo data)</div>
            <div className="px-5 pb-4"><AnimatedBars data={salesWeeks} /></div>
          </Panel>

          <Panel title="Top Products">
            {topProducts.length === 0 ? (
              <EmptyState title="No sales yet" body="Top performers will appear once you start receiving orders." />
            ) : (
              <ul>
                {topProducts.map((p, i) => (
                  <li key={p.product_id} className={`flex items-center gap-3 px-5 py-3.5 ${i !== topProducts.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-xl">{productEmoji(p.category_name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-cream text-sm truncate">{p.name}</div>
                      <div className="text-xs text-cream/50">{p.sold} sold · {p.quantity} in stock</div>
                    </div>
                    <div className={`font-bold ${p.sold > 0 ? 'text-mint-300' : 'text-cream/40'}`}>{p.sold > 0 ? '↑' : '–'}</div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}

      {active === 'company' && (
        <Panel title="Company details">
          <form onSubmit={saveCompany} className="p-5 space-y-4 max-w-xl">
            <div>
              <label className="label">Company name</label>
              <input className="input" value={companyForm.company_name} onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })} required />
            </div>
            <div>
              <label className="label">GST number</label>
              <input className="input" value={companyForm.gst_number} onChange={(e) => setCompanyForm({ ...companyForm, gst_number: e.target.value })} placeholder="GST-1234" />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} required />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50">Current rating</div>
              <div className="text-cream font-semibold mt-1">★ {Number(supplier?.rating || 0).toFixed(2)}</div>
            </div>
            <button type="submit" className="btn-mint px-5 py-2">Save changes</button>
          </form>
        </Panel>
      )}

      {active === 'reviews' && (
        <Panel title="Reviews on your products">
          {reviewsLoading ? (
            <div className="p-6 text-cream/60 text-sm">Loading reviews…</div>
          ) : products.length === 0 ? (
            <EmptyState title="No products yet" body="Add a product first — reviews will appear once farmers leave them." />
          ) : (
            <div className="divide-y divide-white/5">
              {products.map((p) => {
                const list = productReviews[p.product_id] || [];
                const avg = list.length ? list.reduce((s, r) => s + r.rating, 0) / list.length : null;
                return (
                  <div key={p.product_id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-lg shrink-0">{productEmoji(p.category_name)}</div>
                        <div className="font-semibold text-cream truncate">{p.name}</div>
                      </div>
                      <div className="text-xs text-cream/60 shrink-0">
                        {avg !== null ? <>★ {avg.toFixed(1)} · {list.length} review{list.length === 1 ? '' : 's'}</> : 'No reviews yet'}
                      </div>
                    </div>
                    {list.length > 0 && (
                      <ul className="mt-3 space-y-2 ml-12">
                        {list.slice(0, 3).map((r) => (
                          <li key={r.review_id} className="text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gold-300">{'★'.repeat(r.rating)}<span className="text-cream/20">{'★'.repeat(5 - r.rating)}</span></span>
                              <span className="text-cream/60 text-xs">{r.farmer_name}</span>
                            </div>
                            {r.comment && <div className="text-cream/70 text-xs mt-0.5">{r.comment}</div>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {active === 'settings' && (
        <Panel title="Account preferences">
          <div className="p-6 space-y-5 max-w-xl">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Signed in as</div>
              <div className="text-cream font-semibold break-all">{user?.email}</div>
              <div className="text-cream/60 text-sm">{user?.full_name} · {user?.role}</div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Notifications</div>
              <label className="flex items-center gap-2 text-cream/80 text-sm">
                <input type="checkbox" defaultChecked className="rounded accent-mint-400" />
                Email me when an order is placed
              </label>
              <label className="flex items-center gap-2 text-cream/80 text-sm mt-2">
                <input type="checkbox" defaultChecked className="rounded accent-mint-400" />
                Email me on low-stock alerts
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

      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4" onClick={closeModal}>
            <motion.form
              role="dialog" aria-modal="true" aria-labelledby="add-product-title" onSubmit={submitProduct}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeModal} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="add-product-title" className="font-display text-xl font-bold text-cream">Add new product</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">Inserts into Products and Inventory.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="prod-name" className="label">Product name</label>
                  <input id="prod-name" className="input" placeholder="e.g. Urea (46% N) — 50kg bag" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <Select
                    value={String(form.category_id || categories[0]?.category_id || '')}
                    onChange={(v) => setForm({ ...form, category_id: v })}
                    options={categories.map((c) => ({ value: String(c.category_id), label: c.name }))}
                    ariaLabel="Product category"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-price" className="label">Unit price (Rs)</label>
                    <input id="prod-price" type="number" min="1" step="any" inputMode="decimal" className="input" placeholder="4200" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div>
                    <label htmlFor="prod-stock" className="label">Stock quantity</label>
                    <input id="prod-stock" type="number" min="0" step="1" inputMode="numeric" className="input" placeholder="200" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                  <button type="submit" className="btn-mint px-5 py-2">Add product</button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel order confirmation */}
      <AnimatePresence>
        {cancelTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCancelTarget(null)} className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              role="alertdialog" aria-modal="true" aria-labelledby="cancel-ord-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-md ring-glow relative"
            >
              <button type="button" onClick={() => setCancelTarget(null)} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="cancel-ord-title" className="font-display text-xl font-bold text-cream">Cancel this order?</h3>
              <p className="text-cream/70 text-sm mt-2">
                <strong className="text-cream">#ORD-{cancelTarget.order_id}</strong> · {cancelTarget.farmer_name}
              </p>
              <p className="text-cream/60 text-sm mt-3">
                The order will be marked cancelled and the reserved stock returned to inventory. The farmer will see the cancelled status on their dashboard.
              </p>
              <div className="flex gap-3 justify-end pt-5">
                <button type="button" onClick={() => setCancelTarget(null)} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Keep order</button>
                <button type="button" onClick={cancelOrder} className="px-5 py-2 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 font-semibold inline-flex items-center gap-1.5">
                  <Ban size={14} /> Cancel order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove product confirmation */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmRemove(null)} className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              role="alertdialog" aria-modal="true" aria-labelledby="del-prod-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-md ring-glow relative"
            >
              <button type="button" onClick={() => setConfirmRemove(null)} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="del-prod-title" className="font-display text-xl font-bold text-cream">Remove this product?</h3>
              <p className="text-cream/70 text-sm mt-2">
                <strong className="text-cream">{confirmRemove.name}</strong>
              </p>
              <p className="text-cream/60 text-sm mt-3">
                The product will be unlisted from the marketplace. Past orders are preserved and you can re-list it any time from the Inventory tab.
              </p>
              <div className="flex gap-3 justify-end pt-5">
                <button type="button" onClick={() => setConfirmRemove(null)} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                <button type="button" onClick={removeProduct} className="px-5 py-2 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 font-semibold inline-flex items-center gap-1.5">
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashShell>
  );
}
