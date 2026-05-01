import { Inbox } from 'lucide-react';

/**
 * Friendly empty state for dashboard panels and lists.
 * Replaces silent zero-row tables with a helpful nudge + optional action.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  body,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-10 ${className}`}>
      <div className="w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br from-mint-500/30 to-mint-300/10 ring-1 ring-mint-300/20 mb-4">
        <Icon size={22} className="text-mint-300" />
      </div>
      <div className="font-display font-bold text-cream">{title}</div>
      {body && <div className="text-sm text-cream/55 mt-1.5 max-w-xs">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
