import { useMemo, useState } from 'react';
import usePersistedState from '../lib/usePersistedState.js';
import useEscapeKey from '../lib/useEscapeKey.js';
import { scrollToPanel } from '../lib/scrollToPanel.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Users, Building2, Boxes, Package, Wallet, FileText, Settings,
  ShieldCheck, AlertTriangle, X, Plus,
} from 'lucide-react';
import DashShell from '../components/DashShell.jsx';
import Topbar from '../components/Topbar.jsx';
import StatCard from '../components/StatCard.jsx';
import Panel from '../components/Panel.jsx';
import StatusPill from '../components/StatusPill.jsx';
import Select from '../components/Select.jsx';
import { useToast } from '../context/ToastContext.jsx';

const sidebarItems = [
  { key: 'home',      label: 'Overview',   icon: Home },
  { key: 'users',     label: 'Users',      icon: Users },
  { key: 'suppliers', label: 'Suppliers',  icon: Building2 },
  { key: 'products',  label: 'Products',   icon: Boxes },
  { key: 'orders',    label: 'Orders',     icon: Package },
  { key: 'payments',  label: 'Payments',   icon: Wallet },
  { key: 'audit',     label: 'Audit Logs', icon: FileText },
  { key: 'settings',  label: 'Settings',   icon: Settings },
];

const initialUsers = [
  { id: 1, name: 'Asad Khan',           email: 'asad@farm.pk',         role: 'farmer',   joined: '2026-04-12', status: 'active'    },
  { id: 2, name: 'Fauji Fertilizer Co.',email: 'contact@ffc.com.pk',   role: 'supplier', joined: '2026-01-08', status: 'active'    },
  { id: 3, name: 'Sara Mehmood',        email: 'sara.m@gmail.com',     role: 'farmer',   joined: '2026-04-25', status: 'active'    },
  { id: 4, name: 'Engro AgriTech',      email: 'sales@engro.com',      role: 'supplier', joined: '2026-02-19', status: 'pending'   },
  { id: 5, name: 'Imran Ali',           email: 'imran.a@yahoo.com',    role: 'farmer',   joined: '2026-03-30', status: 'suspended' },
];

const audit = [
  { title: 'Order #ORD-1042 placed',                when: '2 min ago', body: 'Asad Khan → FFC · Transaction COMMIT successful' },
  { title: 'Payment failed — ROLLBACK triggered',   when: '14 min ago',body: 'Order #ORD-1040 · Inventory restored to original state' },
  { title: 'New supplier registered',               when: '1 h ago',   body: 'Engro AgriTech awaiting KYC verification' },
  { title: 'Stock reorder threshold hit',           when: '2 h ago',   body: 'DAP Fertilizer — 12 units remaining (reorder at 20)' },
  { title: 'User suspended',                        when: '5 h ago',   body: 'Imran Ali — repeated payment failures' },
];

const payments = [
  { id: '#PAY-558', method: 'Bank transfer', amount: 'Rs 16,800', status: 'success' },
  { id: '#PAY-557', method: 'Mobile wallet', amount: 'Rs 23,000', status: 'success' },
  { id: '#PAY-556', method: 'Card',          amount: 'Rs 10,800', status: 'success' },
  { id: '#PAY-555', method: 'Card',          amount: 'Rs 9,600',  status: 'failed'  },
  { id: '#PAY-554', method: 'Cash',          amount: 'Rs 2,400',  status: 'pending' },
];

export default function AdminDashboard() {
  const [active, setActive] = usePersistedState('agf_admin_tab', 'home');
  const [users, setUsers] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState('All');
  const [editing, setEditing] = useState(null);
  const [adding, setAdding]   = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'farmer' });
  const toast = useToast();

  const filtered = useMemo(() => {
    if (roleFilter === 'All') return users;
    return users.filter((u) => u.role === roleFilter.toLowerCase().replace(/s$/, ''));
  }, [users, roleFilter]);

  // Suspend ↔ Reactivate. Pending users use reviewKyc() instead — they
  // hit the "Review" CTA, never this function.
  const toggleStatus = (u) => {
    const next = u.status === 'suspended' ? 'active' : 'suspended';
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: next } : x));
    if (next === 'active') toast.success('User reactivated', u.name);
    else toast.error('User suspended', u.name);
  };

  const reviewKyc = (u) => {
    setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, status: 'active' } : x));
    toast.success('KYC verified', `${u.name} is now active`);
  };

  const exportCsv = () => toast.success('Audit log exported', 'audit-log-2026.csv');

  const saveEdit = (e) => {
    e.preventDefault();
    setUsers((prev) => prev.map((x) => x.id === editing.id ? editing : x));
    toast.success('User updated', editing.name);
    setEditing(null);
  };

  const closeAdd = () => { setAdding(false); setNewUser({ name: '', email: '', role: 'farmer' }); };
  const closeEdit = () => setEditing(null);

  const submitAdd = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.error('Missing fields', 'Name and email are required');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newUser.email.trim());
    if (!emailOk) {
      toast.error('Invalid email', 'Enter a valid email address');
      return;
    }
    const u = { ...newUser, id: Date.now(), status: 'active', joined: new Date().toISOString().slice(0, 10) };
    setUsers((prev) => [u, ...prev]);
    toast.success('User created', u.name);
    closeAdd();
  };

  // Sidebar tab → scroll to matching panel (where applicable)
  const handleNav = (k) => {
    setActive(k);
    if (k === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const map = { users: 'panel-users', audit: 'panel-audit', payments: 'panel-payments' };
    if (map[k]) scrollToPanel(map[k]);
    else toast.info('Coming soon', `${k} view will be wired up after backend integration`);
  };

  // Modals close on Escape
  useEscapeKey(!!editing, closeEdit);
  useEscapeKey(adding,    closeAdd);

  return (
    <DashShell sidebarItems={sidebarItems} active={active} onSelect={handleNav}>
      <Topbar title="System Overview" subtitle="All-system pulse for the AgriFlow platform." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users}         label="Total Users"          value={users.length}          trend={{ up: true,  text: '42 this week' }}    accent="mint"   />
        <StatCard icon={Building2}     label="Active Suppliers"     value={users.filter((u) => u.role === 'supplier' && u.status === 'active').length} trend={{ up: true,  text: '6 this month' }}  accent="forest" />
        <StatCard icon={Wallet}        label="Platform GMV"         value={18.4} suffix="M" prefix="Rs " trend={{ up: true,  text: '22.7% MoM' }}  accent="gold"   />
        <StatCard icon={AlertTriangle} label="Failed Transactions"  value={3}                     trend={{ up: false, text: 'Auto-rolled back' }} accent="red"    />
      </div>

      <Panel
        id="panel-users"
        title="User Management"
        action={
          <div className="flex gap-2 items-center">
            <Select
              size="sm"
              value={roleFilter}
              onChange={setRoleFilter}
              options={['All', 'Farmers', 'Suppliers', 'Admins']}
              ariaLabel="Filter users by role"
              className="w-32"
            />
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 rounded-lg shimmer text-cream font-semibold text-sm inline-flex items-center gap-1.5 active:scale-95"
            ><Plus size={14}/> Add user</button>
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
                <th className="text-left px-5 py-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-cream/50 py-10">No users match this filter.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-mint-300 to-mint-600 grid place-items-center font-bold text-ink text-sm">
                        {u.name.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                      </div>
                      <div className="font-semibold text-cream">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-cream/70">{u.email}</td>
                  <td className="px-5 py-3"><StatusPill status={u.role} /></td>
                  <td className="px-5 py-3 text-cream/70">{u.joined}</td>
                  <td className="px-5 py-3"><StatusPill status={u.status} /></td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {u.status === 'pending' ? (
                      <button onClick={() => reviewKyc(u)} className="px-2.5 py-1 rounded-lg bg-mint-400/20 text-mint-200 hover:bg-mint-400/30 text-xs font-semibold">Review</button>
                    ) : (
                      <>
                        <button onClick={() => setEditing(u)} className="px-2.5 py-1 rounded-lg text-cream/70 hover:text-cream hover:bg-white/5 text-xs">Edit</button>
                        <button
                          onClick={() => toggleStatus(u)}
                          className={`ml-1 px-2.5 py-1 rounded-lg text-xs ${
                            u.status === 'suspended'
                              ? 'text-mint-200 hover:bg-mint-400/15'
                              : 'text-red-300 hover:bg-red-500/10'
                          }`}
                        >
                          {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-3 gap-6">
        <Panel
          id="panel-audit"
          title="Audit Log"
          className="lg:col-span-2"
          action={<button onClick={exportCsv} className="text-mint-300 text-sm font-semibold hover:underline">Export CSV</button>}
        >
          <ul>
            {audit.map((a, i) => (
              <li key={`${a.when}-${a.title}`} className={`px-5 py-4 ${i !== audit.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-mint-300" />
                    <strong className="text-cream text-sm">{a.title}</strong>
                  </div>
                  <span className="text-xs text-cream/50">{a.when}</span>
                </div>
                <div className="text-xs text-cream/60 mt-1 ml-6">{a.body}</div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel id="panel-payments" title="Recent Payments">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-cream/50 border-b border-white/10">
                <th className="text-left px-5 py-3">Txn</th>
                <th className="text-left px-5 py-3">Amount</th>
                <th className="text-left px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition cursor-pointer" onClick={() => toast.info(p.id, `${p.method} · ${p.amount}`)}>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-cream">{p.id}</div>
                    <div className="text-[11px] text-cream/50">{p.method}</div>
                  </td>
                  <td className="px-5 py-3 text-cream/80">{p.amount}</td>
                  <td className="px-5 py-3"><StatusPill status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Edit user modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeEdit}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-user-title"
              onSubmit={saveEdit}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeEdit} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="edit-user-title" className="font-display text-xl font-bold text-cream">Edit user</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">Update fields and save — UPDATE Users WHERE user_id = …</p>
              <div className="space-y-4">
                <div><label className="label">Full name</label><input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div><label className="label">Email</label><input type="email" className="input" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
                <div className="grid sm:grid-cols-2 gap-4">
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
                  <div>
                    <label className="label">Status</label>
                    <Select
                      value={editing.status}
                      onChange={(v) => setEditing({ ...editing, status: v })}
                      options={[
                        { value: 'active',    label: 'Active' },
                        { value: 'pending',   label: 'Pending' },
                        { value: 'suspended', label: 'Suspended' },
                      ]}
                      ariaLabel="Status"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-xl text-cream/70 hover:text-cream">Cancel</button>
                  <button type="submit" className="btn-mint px-5 py-2">Save changes</button>
                </div>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add user modal */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeAdd}
            className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm grid place-items-center p-4"
          >
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-user-title"
              onSubmit={submitAdd}
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.94, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.94, y: 20, opacity: 0 }}
              className="gradient-border p-7 w-full max-w-lg ring-glow relative"
            >
              <button type="button" onClick={closeAdd} aria-label="Close" className="absolute top-4 right-4 w-8 h-8 grid place-items-center rounded-lg bg-white/5 hover:bg-white/10 text-cream"><X size={14} /></button>
              <h3 id="add-user-title" className="font-display text-xl font-bold text-cream">Add user</h3>
              <p className="text-cream/60 text-sm mt-1 mb-5">INSERT INTO Users(full_name, email, role, …)</p>
              <div className="space-y-4">
                <div><label htmlFor="new-user-name" className="label">Full name</label><input id="new-user-name" className="input" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Asad Khan" required /></div>
                <div><label htmlFor="new-user-email" className="label">Email</label><input id="new-user-email" type="email" className="input" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@farm.pk" required /></div>
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
    </DashShell>
  );
}
