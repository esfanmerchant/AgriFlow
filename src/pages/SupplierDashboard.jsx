import { useState, useMemo } from 'react';
import usePersistedState from '../lib/usePersistedState.js';
import useEscapeKey from '../lib/useEscapeKey.js';
import { scrollToPanel } from '../lib/scrollToPanel.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Boxes, Package, BarChart3, Star, Settings, Building2,
  Wallet, AlertTriangle, Plus, X, CheckCircle2, Truck, MapPin, FileText,
} from 'lucide-react';
import DashShell from '../components/DashShell.jsx';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Panel from '../components/Panel.jsx';
import StatusPill from '../components/StatusPill.jsx';
import Select from '../components/Select.jsx';
import AnimatedBars from '../components/AnimatedBars.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const sidebarItems = [
  { key: 'home',      label: 'Overview',        icon: Home },
  { key: 'inventory', label: 'Inventory',       icon: Boxes },
  { key: 'orders',    label: 'Orders',          icon: Package },
  { key: 'sales',     label: 'Sales Analytics', icon: BarChart3 },
  { key: 'reviews',   label: 'Reviews',         icon: Star },
  { key: 'company',   label: 'Company',         icon: Building2 },
  { key: 'settings',  label: 'Settings',        icon: Settings },
];

const salesWeeks = [
  { label: 'W1', value: 35 }, { label: 'W2', value: 50 }, { label: 'W3', value: 42 },
  { label: 'W4', value: 62 }, { label: 'W5', value: 55 }, { label: 'W6', value: 70 },
  { label: 'W7', value: 65 }, { label: 'W8', value: 80 }, { label: 'W9', value: 72 },
  { label: 'W10', value: 88 },{ label: 'W11', value: 95 },{ label: 'W12', value: 100 },
];

const topProducts = [
  { emoji: '🌾', name: 'Urea Fertilizer',     stat: '412 sold · Rs 1.73M', up: true },
  { emoji: '🌱', name: 'DAP Fertilizer',      stat: '198 sold · Rs 2.27M', up: true },
  { emoji: '🌽', name: 'Hybrid Maize Seed',   stat: '145 sold · Rs 464K',  up: true },
  { emoji: '💧', name: 'Drip Irrigation Tape',stat: '98 sold · Rs 235K',   up: false },
];

const initialOrders = [
  { id: '#ORD-1042', farmer: 'Asad Khan',    product: 'Urea (50kg)',     qty: '4 bags',  total: 'Rs 16,800', status: 'pending'   },
  { id: '#ORD-1041', farmer: 'Bilal Ahmed',  product: 'DAP (50kg)',      qty: '2 bags',  total: 'Rs 23,000', status: 'confirmed' },
  { id: '#ORD-1040', farmer: 'Sara Mehmood', product: 'Compost (25kg)',  qty: '6 bags',  total: 'Rs 10,800', status: 'shipped'   },
  { id: '#ORD-1039', farmer: 'Imran Ali',    product: 'Maize Seed (5kg)',qty: '3 packs', total: 'Rs 9,600',  status: 'delivered' },
  { id: '#ORD-1038', farmer: 'Ayesha Tariq', product: 'Drip Tape (100m)',qty: '1 roll',  total: 'Rs 2,400',  status: 'cancelled' },
];

/* status flow: pending -> confirmed -> shipped -> delivered */
const nextStatus = {
  pending:   { next: 'confirmed', label: 'Confirm', icon: CheckCircle2 },
  confirmed: { next: 'shipped',   label: 'Ship',    icon: Truck },
  shipped:   { next: 'delivered', label: 'Track',   icon: MapPin },
  delivered: { next: 'delivered', label: 'Receipt', icon: FileText },
  cancelled: { next: 'cancelled', label: 'Details', icon: FileText },
};

export default function SupplierDashboard() {
  const [active, setActive] = usePersistedState('agf_supplier_tab', 'home');
  const [modalOpen, setModalOpen] = useState(false);
  const [orders, setOrders] = useState(initialOrders);
  const [statusFilter, setStatusFilter] = useState('All');
  const [chartMode, setChartMode] = useState('Revenue');
  const [form, setForm] = useState({ name: '', cat: 'Fertilizers', price: '', stock: '', desc: '' });
  const { user } = useAuth();
  const toast = useToast();

  const visible = useMemo(() => {
    if (statusFilter === 'All') return orders;
    return orders.filter((o) => o.status === statusFilter.toLowerCase());
  }, [orders, statusFilter]);

  const advance = (o) => {
    const flow = nextStatus[o.status];
    // Unknown status — surface but don't crash.
    if (!flow) {
      toast.info('Order', `${o.id} · ${o.product}`);
      return;
    }
    // Terminal state (delivered/cancelled) — informational only.
    if (flow.next === o.status) {
      toast.info(flow.label, `${o.id} · ${o.product}`);
      return;
    }
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, status: flow.next } : x));
    toast.success(`${o.id} → ${flow.next}`, `${o.farmer} · ${o.product}`);
  };

  const resetForm = () => setForm({ name: '', cat: 'Fertilizers', price: '', stock: '', desc: '' });
  const closeModal = () => { setModalOpen(false); resetForm(); };

  const submitProduct = (e) => {
    e.preventDefault();
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    if (!form.name.trim()) {
      toast.error('Missing field', 'Product name is required');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error('Invalid price', 'Enter a price greater than 0');
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum)) {
      toast.error('Invalid stock', 'Enter a non-negative integer');
      return;
    }
    toast.success('Product added', `${form.name} · ${form.cat} · Rs ${priceNum.toLocaleString()}`);
    closeModal();
  };

  // Sidebar tab → scroll to matching panel
  const handleNav = (k) => {
    setActive(k);
    if (k === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const map = { inventory: 'panel-sales', sales: 'panel-sales', orders: 'panel-orders' };
    if (map[k]) scrollToPanel(map[k]);
    else toast.info('Coming soon', `${k} view will be wired up after backend integration`);
  };

  useEscapeKey(modalOpen, closeModal);

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar
        title="Supplier Overview"
        subtitle={<>Hi <span className="text-mint-300 font-semibold">{user?.name || 'Supplier'}</span> — here's how your business is performing.</>}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl shimmer text-cream font-semibold text-sm inline-flex items-center gap-2 active:scale-95 transition"
          >
            <Plus size={16} /> Add Product
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Wallet}        label="Total Revenue"     value={1.24} suffix="M" prefix="Rs " trend={{ up: true,  text: '18.2% vs last month' }} accent="mint"   />
        <StatCard icon={Package}       label="Pending Orders"    value={orders.filter((o) => o.status === 'pending').length} trend={{ up: true,  text: '5 new today' }}        accent="gold"   />
        <StatCard icon={Boxes}         label="Products Listed"   value={42} trend={{ up: true,  text: '3 added this week' }}                                                  accent="forest" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts"  value={7}  trend={{ up: false, text: 'Needs reorder' }}                                                      accent="red"    />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel
          id="panel-sales"
          title="Sales Trend"
          className="lg:col-span-2"
          action={
            <Select
              size="sm"
              value={chartMode}
              onChange={(v) => { setChartMode(v); toast.info('Chart updated', v); }}
              options={['Revenue', 'Orders', 'Units']}
              ariaLabel="Sales chart mode"
              className="w-32"
            />
          }
        >
          <div className="px-5 pt-4 text-xs text-cream/50">{chartMode} · last 12 weeks · powered by SUM() & GROUP BY</div>
          <div className="px-5"><AnimatedBars data={salesWeeks} /></div>
        </Panel>

        <Panel
          title="Top Products"
          action={<button onClick={() => toast.info('Coming soon', 'Detailed sales report')} className="text-mint-300 text-sm font-semibold hover:underline">Full report</button>}
        >
          <ul>
            {topProducts.map((t, i) => (
              <li key={t.name} className={`flex items-center gap-3 px-5 py-3.5 ${i !== topProducts.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center text-xl">{t.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-cream text-sm truncate">{t.name}</div>
                  <div className="text-xs text-cream/50">{t.stat}</div>
                </div>
                <div className={`font-bold ${t.up ? 'text-mint-300' : 'text-red-300'}`}>{t.up ? '↑' : '↓'}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        id="panel-orders"
        title="Incoming Orders"
        action={
          <div className="flex gap-1.5 text-xs">
            {['All', 'Pending', 'Confirmed', 'Shipped'].map((b) => (
              <button
                key={b}
                onClick={() => setStatusFilter(b)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === b ? 'bg-mint-400/20 text-mint-200' : 'bg-white/5 hover:bg-white/10 text-cream/70'
                }`}
              >{b}</button>
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
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3">Qty</th>
                <th className="text-left px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-cream/50 py-10">No orders match this filter.</td></tr>
              ) : visible.map((o) => {
                const flow = nextStatus[o.status];
                const Icon = flow.icon;
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3 font-semibold text-cream">{o.id}</td>
                    <td className="px-5 py-3 text-cream/80">{o.farmer}</td>
                    <td className="px-5 py-3 text-cream/80">{o.product}</td>
                    <td className="px-5 py-3 text-cream/80">{o.qty}</td>
                    <td className="px-5 py-3 text-cream/80">{o.total}</td>
                    <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => advance(o)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 active:scale-95 transition"
                        style={{ background: 'linear-gradient(135deg,#5eead4,#2dd4bf 50%,#0d9488)', color: '#06120c' }}
                      >
                        <Icon size={13} /> {flow.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Add product modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4"
            onClick={closeModal}
          >
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-product-title"
              onSubmit={submitProduct}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeModal} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="add-product-title" className="font-display text-xl font-bold text-cream">Add new product</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">This will INSERT INTO Products and Inventory.</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="prod-name" className="label">Product name</label>
                  <input id="prod-name" className="input" placeholder="e.g. Urea (46% N) — 50kg bag" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Category</label>
                  <Select
                    value={form.cat}
                    onChange={(v) => setForm({ ...form, cat: v })}
                    options={['Fertilizers', 'Pesticides', 'Seeds', 'Farm Tools', 'Irrigation']}
                    ariaLabel="Product category"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="prod-price" className="label">Unit price (Rs)</label>
                    <input
                      id="prod-price"
                      type="number"
                      min="1"
                      step="any"
                      inputMode="decimal"
                      className="input"
                      placeholder="4200"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="prod-stock" className="label">Stock quantity</label>
                    <input
                      id="prod-stock"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      className="input"
                      placeholder="200"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                    />
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
    </DashShell>
  );
}
