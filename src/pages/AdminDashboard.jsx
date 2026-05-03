import { useEffect, useMemo, useState } from 'react';
import usePersistedState from '../lib/usePersistedState.js';
import useEscapeKey from '../lib/useEscapeKey.js';
import { scrollToPanel } from '../lib/scrollToPanel.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Building2, Boxes, Package, Wallet, FileText, Settings,
  ShieldCheck, AlertTriangle, X, Plus, Trash2, Tag, Pencil, Save,
} from 'lucide-react';
import DashShell from '../components/DashShell.jsx';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Panel from '../components/Panel.jsx';
import StatusPill from '../components/StatusPill.jsx';
import Select from '../components/Select.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { formatRs } from '../lib/productDisplay.js';

const sidebarItems = [
  { key: 'home',      label: 'Overview',   icon: Home },
  { key: 'users',     label: 'Users',      icon: Users },
  { key: 'suppliers', label: 'Suppliers',  icon: Building2 },
  { key: 'products',  label: 'Products',   icon: Boxes },
  { key: 'categories', label: 'Categories', icon: Tag },
  { key: 'orders',    label: 'Orders',     icon: Package },
  { key: 'payments',  label: 'Payments',   icon: Wallet },
  { key: 'audit',     label: 'Audit Logs', icon: FileText },
  { key: 'settings',  label: 'Settings',   icon: Settings },
];

// Synthesises an "audit log" from recent users, orders and payments, since
// the schema doesn't yet have a dedicated audit_log table.
const relativeWhen = (iso) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
};

const buildAuditLog = (users, orders, payments) => {
  const entries = [];
  for (const u of users.slice(0, 8)) {
    entries.push({
      key: `u-${u.user_id}`,
      title: `New ${u.role} registered`,
      body: `${u.full_name} · ${u.email}`,
      when: u.created_at,
    });
  }
  for (const o of orders.slice(0, 8)) {
    entries.push({
      key: `o-${o.order_id}`,
      title: o.status === 'cancelled' ? 'Order cancelled' : 'Order placed',
      body: `#ORD-${o.order_id} · ${o.farmer_name} · Rs ${Number(o.total_amount).toLocaleString()}`,
      when: o.ordered_at,
    });
  }
  for (const p of payments.slice(0, 8)) {
    entries.push({
      key: `p-${p.payment_id}`,
      title: p.status === 'failed'
        ? 'Payment failed — ROLLBACK triggered'
        : `Payment ${p.status}`,
      body: `#PAY-${p.payment_id} · ${p.method} · Rs ${Number(p.amount).toLocaleString()}`,
      when: p.paid_at,
    });
  }
  entries.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
  return entries.slice(0, 8);
};

export default function AdminDashboard() {
  const [active, setActive] = usePersistedState('agf_admin_tab', 'home');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', phone: '', role: 'farmer' });
  const toast = useToast();
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [u, s, p, o] = await Promise.all([
          api('/admin/users'),
          api('/admin/stats'),
          api('/payments'),
          api('/orders'),
        ]);
        if (cancelled) return;
        setUsers(u);
        setStats(s);
        setPayments(p);
        setOrders(o);
      } catch (err) {
        if (!cancelled) toast.error('Could not load admin data', err.message);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (roleFilter === 'All') return users;
    const role = roleFilter.toLowerCase().replace(/s$/, '');
    return users.filter((u) => u.role === role);
  }, [users, roleFilter]);

  const closeAdd = () => { setAdding(false); setNewUser({ full_name: '', email: '', password: '', phone: '', role: 'farmer' }); };
  const closeEdit = () => setEditing(null);
  const closeConfirmDelete = () => setConfirmDelete(null);

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!newUser.full_name.trim() || !newUser.email.trim() || newUser.password.length < 8) {
      toast.error('Missing fields', 'Name, email, and a password ≥ 8 chars are required');
      return;
    }
    try {
      const body = { ...newUser, phone: newUser.phone?.trim() || null };
      const created = await api('/admin/users', { method: 'POST', body });
      setUsers((prev) => [created, ...prev]);
      toast.success('User created', created.full_name);
      closeAdd();
    } catch (err) {
      toast.error('Could not create user', err.message);
    }
  };

  const approveUser = async (u) => {
    try {
      const updated = await api(`/admin/users/${u.user_id}/approve`, { method: 'POST' });
      setUsers((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
      toast.success('Supplier approved', updated.full_name);
    } catch (err) {
      toast.error('Could not approve supplier', err.message);
    }
  };

  const deleteUser = async () => {
    if (!confirmDelete) return;
    try {
      await api(`/admin/users/${confirmDelete.user_id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.user_id !== confirmDelete.user_id));
      toast.success('User deleted', confirmDelete.full_name);
      setConfirmDelete(null);
      if (editing && editing.user_id === confirmDelete.user_id) setEditing(null);
    } catch (err) {
      toast.error('Could not delete user', err.message);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const updated = await api(`/admin/users/${editing.user_id}`, {
        method: 'PATCH',
        body: {
          full_name: editing.full_name,
          email: editing.email,
          phone: editing.phone?.trim() || null,
          role: editing.role,
        },
      });
      setUsers((prev) => prev.map((x) => x.user_id === updated.user_id ? updated : x));
      toast.success('User updated', updated.full_name);
      setEditing(null);
    } catch (err) {
      toast.error('Could not update user', err.message);
    }
  };

  const auditLog = useMemo(() => buildAuditLog(users, orders, payments), [users, orders, payments]);

  const exportCsv = () => {
    const rows = [
      ['When', 'Event', 'Details'],
      ...auditLog.map((e) => [e.when || '', e.title, e.body]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriflow-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Audit log exported', `${auditLog.length} rows`);
  };

  const HOME_VIEW_TABS = new Set(['home', 'users', 'audit', 'payments']);

  const handleNav = (k) => {
    setActive(k);
    if (HOME_VIEW_TABS.has(k)) {
      if (k === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else {
        const map = { users: 'panel-users', audit: 'panel-audit', payments: 'panel-payments' };
        if (map[k]) scrollToPanel(map[k]);
      }
    }
  };

  const isHomeView = HOME_VIEW_TABS.has(active);

  // Lazy-load supplier / product / category lists for the dedicated tabs
  const [suppliers, setSuppliers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingCat, setEditingCat] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', parent_id: '' });
  useEffect(() => {
    if (active === 'suppliers' && suppliers.length === 0) {
      api('/suppliers').then(setSuppliers).catch((err) => toast.error('Could not load suppliers', err.message));
    }
    if (active === 'products' && allProducts.length === 0) {
      api('/products', { auth: false, query: { include_inactive: true, limit: 200 } })
        .then(setAllProducts)
        .catch((err) => toast.error('Could not load products', err.message));
    }
    if (active === 'categories' && categories.length === 0) {
      api('/categories', { auth: false }).then(setCategories).catch((err) => toast.error('Could not load categories', err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const reloadCategories = async () => {
    try { setCategories(await api('/categories', { auth: false })); } catch { /* ignore */ }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    const name = newCat.name.trim();
    if (!name) { toast.error('Name required'); return; }
    try {
      await api('/categories', {
        method: 'POST',
        body: { name, parent_id: newCat.parent_id ? Number(newCat.parent_id) : null },
      });
      toast.success('Category added', name);
      setNewCat({ name: '', parent_id: '' });
      reloadCategories();
    } catch (err) {
      toast.error('Could not add category', err.message);
    }
  };

  const saveCategory = async () => {
    if (!editingCat) return;
    const name = editingCat.name?.trim();
    if (!name) { toast.error('Name required'); return; }
    try {
      await api(`/categories/${editingCat.category_id}`, {
        method: 'PATCH',
        body: { name, parent_id: editingCat.parent_id ?? null },
      });
      toast.success('Category updated', name);
      setEditingCat(null);
      reloadCategories();
    } catch (err) {
      toast.error('Could not update category', err.message);
    }
  };

  const deleteCategory = async (c) => {
    try {
      await api(`/categories/${c.category_id}`, { method: 'DELETE' });
      toast.success('Category deleted', c.name);
      setCategories((prev) => prev.filter((x) => x.category_id !== c.category_id));
    } catch (err) {
      toast.error('Could not delete category', err.message);
    }
  };

  useEscapeKey(!!editing, closeEdit);
  useEscapeKey(adding, closeAdd);
  useEscapeKey(!!confirmDelete, closeConfirmDelete);

  const initials = (name) => name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar
        title={
          active === 'suppliers' ? 'All Suppliers'
          : active === 'products' ? 'All Products'
          : active === 'categories' ? 'Product Categories'
          : active === 'orders' ? 'All Orders'
          : active === 'settings' ? 'System Settings'
          : 'System Overview'
        }
        subtitle={
          active === 'suppliers' ? 'Companies registered on the platform.'
          : active === 'products' ? 'Every product currently listed.'
          : active === 'categories' ? 'Manage the catalogue taxonomy used across the marketplace.'
          : active === 'orders' ? 'Every order placed across the platform.'
          : active === 'settings' ? 'Account and platform configuration.'
          : 'All-system pulse for the AgriFlow platform.'
        }
      />

      {isHomeView && (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}         label="Total Users"          value={stats?.total_users ?? users.length}                                accent="mint"   />
        <StatCard icon={Building2}     label="Suppliers"            value={stats?.suppliers ?? users.filter((u) => u.role === 'supplier').length} accent="forest" />
        <StatCard icon={Wallet}        label="Platform GMV"         value={stats?.gmv ?? 0} prefix="Rs "                                       accent="gold"   />
        <StatCard icon={AlertTriangle} label="Failed Transactions"  value={stats?.failed_payments ?? 0}                                       accent="red"    />
      </div>
      )}

      {isHomeView && (
      <Panel
        id="panel-users"
        title="User Management"
        action={
          <div className="flex gap-2 items-center">
            <Select size="sm" value={roleFilter} onChange={setRoleFilter} options={['All', 'Farmers', 'Suppliers', 'Admins']} ariaLabel="Filter users by role" className="w-32" />
            <button onClick={() => setAdding(true)} className="px-3 py-1.5 rounded-lg shimmer text-cream font-semibold text-sm inline-flex items-center gap-1.5 active:scale-95">
              <Plus size={14}/> Add user
            </button>
          </div>
        }
        className="mb-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                <th className="text-left px-5 py-3">User</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Role</th>
                <th className="text-left px-5 py-3">Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-cream/50 py-10">No users match this filter.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center font-bold text-ink text-sm">
                        {initials(u.full_name)}
                      </div>
                      <div className="font-semibold text-cream">{u.full_name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-cream/70">{u.email}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusPill status={u.role} />
                      {u.role === 'supplier' && !u.is_approved && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-[10px] font-semibold uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-cream/70">{u.created_at?.slice(0, 10)}</td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {u.role === 'supplier' && !u.is_approved && (
                      <button
                        onClick={() => approveUser(u)}
                        className="mr-1 px-2.5 py-1 rounded-lg text-mint-300 hover:text-mint-200 hover:bg-mint-500/10 text-xs inline-flex items-center gap-1 font-semibold"
                      >
                        <ShieldCheck size={12} /> Approve
                      </button>
                    )}
                    <button onClick={() => setEditing({ ...u })} className="px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs">Edit</button>
                    {currentAdmin?.user_id !== u.user_id && (
                      <button
                        onClick={() => setConfirmDelete(u)}
                        className="ml-1 px-2.5 py-1 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 text-xs inline-flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      )}

      {isHomeView && (
      <div className="grid lg:grid-cols-3 gap-6">
        <Panel
          id="panel-audit"
          title="Audit Log"
          className="lg:col-span-2"
          action={<button onClick={exportCsv} className="text-mint-300 text-sm font-semibold hover:underline">Export CSV</button>}
        >
          {auditLog.length === 0 ? (
            <EmptyState title="No activity yet" body="Signups, orders and payments will appear here as they happen." />
          ) : (
            <ul>
              {auditLog.map((a, i) => (
                <li key={a.key} className={`px-5 py-4 ${i !== auditLog.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-mint-300" />
                      <strong className="text-cream text-sm">{a.title}</strong>
                    </div>
                    <span className="text-xs text-cream/50">{relativeWhen(a.when)}</span>
                  </div>
                  <div className="text-xs text-cream/60 mt-1 ml-6">{a.body}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel id="panel-payments" title="Recent Payments">
          {payments.length === 0 ? (
            <EmptyState title="No payments yet" body="Payments will appear here once farmers check out." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                  <th className="text-left px-5 py-3">Txn</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 8).map((p) => (
                  <tr key={p.payment_id} className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => toast.info(`#PAY-${p.payment_id}`, `${p.method} · ${formatRs(p.amount)}`)}>
                    <td className="px-5 py-3">
                      <div className="font-semibold text-cream">#PAY-{p.payment_id}</div>
                      <div className="text-[11px] text-cream/50">{p.method}</div>
                    </td>
                    <td className="px-5 py-3 text-cream/80">{formatRs(p.amount)}</td>
                    <td className="px-5 py-3"><StatusPill status={p.status === 'completed' ? 'success' : p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      )}

      {active === 'suppliers' && (
        <Panel title={`Suppliers (${suppliers.length})`}>
          {suppliers.length === 0 ? (
            <EmptyState icon={Building2} title="No suppliers yet" body="Suppliers will appear here once they complete their company profile." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                    <th className="text-left px-5 py-3">Company</th>
                    <th className="text-left px-5 py-3">GST</th>
                    <th className="text-left px-5 py-3">Address</th>
                    <th className="text-left px-5 py-3">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.supplier_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3 font-semibold text-cream">{s.company_name}</td>
                      <td className="px-5 py-3 text-cream/70">{s.gst_number || '—'}</td>
                      <td className="px-5 py-3 text-cream/70">{s.address}</td>
                      <td className="px-5 py-3 text-gold-300 font-semibold">★ {Number(s.rating || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {active === 'products' && (
        <Panel title={`Products (${allProducts.length})`}>
          {allProducts.length === 0 ? (
            <EmptyState icon={Boxes} title="No products yet" body="Suppliers haven't listed any products." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                    <th className="text-left px-5 py-3">Product</th>
                    <th className="text-left px-5 py-3">Supplier</th>
                    <th className="text-left px-5 py-3">Category</th>
                    <th className="text-left px-5 py-3">Price</th>
                    <th className="text-left px-5 py-3">Stock</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map((p) => (
                    <tr key={p.product_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3 font-semibold text-cream">{p.name}</td>
                      <td className="px-5 py-3 text-cream/70">{p.supplier_name}</td>
                      <td className="px-5 py-3 text-cream/70">{p.category_name}</td>
                      <td className="px-5 py-3 text-cream/80">{formatRs(p.unit_price)} / {p.unit}</td>
                      <td className={`px-5 py-3 ${p.quantity <= 0 ? 'text-red-300' : p.quantity <= (p.reorder_level || 10) ? 'text-gold-300' : 'text-cream/80'}`}>{p.quantity}</td>
                      <td className="px-5 py-3"><StatusPill status={p.is_active ? 'active' : 'inactive'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {active === 'categories' && (
        <Panel
          title={`Categories (${categories.length})`}
          action={
            <span className="text-xs text-cream/50">Hierarchical · self-referencing parent_id</span>
          }
        >
          <form onSubmit={createCategory} className="px-3 sm:px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row gap-3">
            <input
              value={newCat.name}
              onChange={(e) => setNewCat((c) => ({ ...c, name: e.target.value }))}
              placeholder="Category name (e.g. Bio-fertilizers)"
              className="input w-full sm:flex-1 min-w-0"
              maxLength={80}
            />
            <select
              value={newCat.parent_id}
              onChange={(e) => setNewCat((c) => ({ ...c, parent_id: e.target.value }))}
              className="input w-full sm:w-56"
            >
              <option value="">No parent (top-level)</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn-mint w-full sm:w-auto justify-center inline-flex items-center gap-1 px-4 shrink-0">
              <Plus size={16} /> Add
            </button>
          </form>

          {categories.length === 0 ? (
            <EmptyState icon={Tag} title="No categories yet" body="Create your first category above." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                    <th className="text-left px-5 py-3">ID</th>
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Parent</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const isEditing = editingCat?.category_id === c.category_id;
                    const parentName = c.parent_id
                      ? categories.find((p) => p.category_id === c.parent_id)?.name || '—'
                      : '—';
                    return (
                      <tr key={c.category_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                        <td className="px-5 py-3 text-cream/60 text-xs">#{c.category_id}</td>
                        <td className="px-5 py-3">
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingCat.name}
                              onChange={(e) => setEditingCat((x) => ({ ...x, name: e.target.value }))}
                              className="input py-1.5 text-sm"
                              maxLength={80}
                            />
                          ) : (
                            <span className="font-semibold text-cream">{c.name}</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-cream/70">
                          {isEditing ? (
                            <select
                              value={editingCat.parent_id ?? ''}
                              onChange={(e) => setEditingCat((x) => ({ ...x, parent_id: e.target.value ? Number(e.target.value) : null }))}
                              className="input py-1.5 text-sm"
                            >
                              <option value="">No parent</option>
                              {categories
                                .filter((p) => p.category_id !== c.category_id)
                                .map((p) => (
                                  <option key={p.category_id} value={p.category_id}>{p.name}</option>
                                ))}
                            </select>
                          ) : (
                            parentName
                          )}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button onClick={saveCategory} className="px-2.5 py-1 rounded-lg text-mint-300 hover:text-mint-200 hover:bg-mint-500/10 text-xs inline-flex items-center gap-1 font-semibold">
                                <Save size={12} /> Save
                              </button>
                              <button onClick={() => setEditingCat(null)} className="ml-1 px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingCat({ ...c })}
                                className="px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs inline-flex items-center gap-1"
                              >
                                <Pencil size={12} /> Edit
                              </button>
                              <button
                                onClick={() => deleteCategory(c)}
                                className="ml-1 px-2.5 py-1 rounded-lg text-red-300/80 hover:text-red-200 hover:bg-red-500/10 text-xs inline-flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </>
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

      {active === 'orders' && (
        <Panel title={`All Orders (${orders.length})`}>
          {orders.length === 0 ? (
            <EmptyState icon={Package} title="No orders yet" body="Orders placed by farmers will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                    <th className="text-left px-5 py-3">Order</th>
                    <th className="text-left px-5 py-3">Farmer</th>
                    <th className="text-left px-5 py-3">Items</th>
                    <th className="text-left px-5 py-3">Total</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Payment</th>
                    <th className="text-left px-5 py-3">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3 font-semibold text-cream">#ORD-{o.order_id}</td>
                      <td className="px-5 py-3 text-cream/80">{o.farmer_name}</td>
                      <td className="px-5 py-3 text-cream/70">{o.items.length}</td>
                      <td className="px-5 py-3 text-cream/80">{formatRs(o.total_amount)}</td>
                      <td className="px-5 py-3"><StatusPill status={o.status} /></td>
                      <td className="px-5 py-3 text-cream/70">{o.payment_status || '—'}</td>
                      <td className="px-5 py-3 text-cream/60 text-xs">{o.ordered_at?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {active === 'settings' && (
        <Panel title="Platform settings">
          <div className="p-6 space-y-5 max-w-xl">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Database</div>
              <div className="text-cream font-semibold">PostgreSQL · agriflow</div>
              <div className="text-cream/60 text-sm">9 tables · BCNF normalised</div>
            </div>
            <div className="border-t border-white/10 pt-5">
              <div className="text-[10px] uppercase tracking-widest text-cream/50 mb-2">Statistics</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-cream/70">Total users</div><div className="text-cream font-semibold">{stats?.total_users ?? 0}</div>
                <div className="text-cream/70">Farmers</div><div className="text-cream font-semibold">{stats?.farmers ?? 0}</div>
                <div className="text-cream/70">Suppliers</div><div className="text-cream font-semibold">{stats?.suppliers ?? 0}</div>
                <div className="text-cream/70">Admins</div><div className="text-cream font-semibold">{stats?.admins ?? 0}</div>
                <div className="text-cream/70">Products</div><div className="text-cream font-semibold">{stats?.total_products ?? 0}</div>
                <div className="text-cream/70">Orders</div><div className="text-cream font-semibold">{stats?.total_orders ?? 0}</div>
                <div className="text-cream/70">GMV</div><div className="text-cream font-semibold">{formatRs(stats?.gmv ?? 0)}</div>
              </div>
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

      {/* Edit user modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeEdit} className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4">
            <motion.form
              role="dialog" aria-modal="true" aria-labelledby="edit-user-title" onSubmit={saveEdit}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeEdit} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="edit-user-title" className="font-display text-xl font-bold text-cream">Edit user</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">Update fields and save.</p>
              <div className="space-y-4">
                <div><label className="label">Full name</label><input className="input" value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} /></div>
                <div><label className="label">Email</label><input type="email" className="input" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                <div><label className="label">Phone</label><input className="input" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="+92 300 1234567" /></div>
                <div>
                  <label className="label">Role</label>
                  <Select
                    value={editing.role}
                    onChange={(v) => setEditing({ ...editing, role: v })}
                    options={[
                      { value: 'farmer',   label: 'Farmer' },
                      { value: 'supplier', label: 'Supplier' },
                      { value: 'admin',    label: 'Admin' },
                    ]}
                    ariaLabel="Role"
                  />
                </div>
                <div className="flex gap-3 justify-between items-center pt-2">
                  {currentAdmin?.user_id !== editing.user_id ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(editing)}
                      className="px-4 py-2 rounded-xl bg-red-500/15 text-red-200 hover:bg-red-500/25 text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  ) : <span />}
                  <div className="flex gap-3">
                    <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                    <button type="submit" className="btn-mint px-5 py-2">Save changes</button>
                  </div>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add user modal */}
      <AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAdd} className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4">
            <motion.form
              role="dialog" aria-modal="true" aria-labelledby="add-user-title" onSubmit={submitAdd}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeAdd} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="add-user-title" className="font-display text-xl font-bold text-cream">Add user</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">Inserts directly into Users.</p>
              <div className="space-y-4">
                <div><label htmlFor="new-user-name" className="label">Full name</label><input id="new-user-name" className="input" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} placeholder="Asad Khan" required /></div>
                <div><label htmlFor="new-user-email" className="label">Email</label><input id="new-user-email" type="email" className="input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@farm.pk" required /></div>
                <div><label htmlFor="new-user-pw" className="label">Initial password (≥ 8 chars)</label><input id="new-user-pw" type="text" className="input" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="temp-pass-123" required /></div>
                <div><label htmlFor="new-user-phone" className="label">Phone (optional)</label><input id="new-user-phone" className="input" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+92 300 1234567" /></div>
                <div>
                  <label className="label">Role</label>
                  <Select
                    value={newUser.role}
                    onChange={(v) => setNewUser({ ...newUser, role: v })}
                    options={[
                      { value: 'farmer',   label: 'Farmer' },
                      { value: 'supplier', label: 'Supplier' },
                      { value: 'admin',    label: 'Admin' },
                    ]}
                    ariaLabel="Role"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeAdd} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                  <button type="submit" className="btn-mint px-5 py-2">Create user</button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete user confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeConfirmDelete} className="fixed inset-0 z-[60] bg-ink/70 backdrop-blur-sm grid place-items-center p-4">
            <motion.div
              role="alertdialog" aria-modal="true" aria-labelledby="del-user-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-md ring-glow relative"
            >
              <button type="button" onClick={closeConfirmDelete} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="del-user-title" className="font-display text-xl font-bold text-cream">Delete this user?</h3>
              <p className="text-cream/70 text-sm mt-2">
                <strong className="text-cream">{confirmDelete.full_name}</strong> · {confirmDelete.email}
              </p>
              <p className="text-cream/60 text-sm mt-3">
                This permanently removes the account. Suppliers will lose their company profile and product listings; farmers with existing orders cannot be deleted until those orders are cancelled.
              </p>
              <div className="flex gap-3 justify-end pt-5">
                <button type="button" onClick={closeConfirmDelete} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                <button type="button" onClick={deleteUser} className="px-5 py-2 rounded-xl bg-red-500/20 text-red-200 hover:bg-red-500/30 font-semibold inline-flex items-center gap-1.5">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashShell>
  );
}
