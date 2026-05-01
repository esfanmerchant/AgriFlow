const map = {
  pending:   'bg-gold-300/15 text-gold-300',
  confirmed: 'bg-blue-500/15 text-blue-300',
  shipped:   'bg-purple-500/15 text-purple-300',
  delivered: 'bg-mint-400/15 text-mint-300',
  cancelled: 'bg-red-500/15 text-red-300',
  success:   'bg-mint-400/15 text-mint-300',
  failed:    'bg-red-500/15 text-red-300',
  active:    'bg-mint-400/15 text-mint-300',
  suspended: 'bg-red-500/15 text-red-300',
  farmer:    'bg-blue-500/15 text-blue-300',
  supplier:  'bg-purple-500/15 text-purple-300',
  admin:     'bg-gold-300/15 text-gold-300',
};

export default function StatusPill({ status, children }) {
  const cls = map[status?.toLowerCase()] || 'bg-white/10 text-cream/80';
  return <span className={`pill ${cls}`}>{children || status}</span>;
}
