const CONFIG = {
  OPTIMAL:  { bg: 'bg-green-100',  text: 'text-green-800',  icon: '✓', label: 'Proceed'       },
  WARNING:  { bg: 'bg-amber-100',  text: 'text-amber-800',  icon: '⚠', label: 'Review Cost'   },
  ALERT:    { bg: 'bg-rust-100',   text: 'text-rust-700',   icon: '⚡', label: 'Reprice'       },
  CRITICAL: { bg: 'bg-red-100',    text: 'text-red-800',    icon: '✗', label: 'Do Not List'   },
  UNKNOWN:  { bg: 'bg-gray-100',   text: 'text-gray-700',   icon: '?', label: 'Manual Review' },
};

export default function RecommendationBadge({ recommendation, compact = false }) {
  if (!recommendation) return null;
  const { status, message, action } = recommendation;
  const c = CONFIG[status] ?? CONFIG.UNKNOWN;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
        {c.icon} {c.label}
      </span>
    );
  }

  return (
    <div className={`rounded-lg px-4 py-3 ${c.bg} ${c.text}`}>
      <div className="flex items-center gap-2 font-semibold text-sm">
        <span className="text-base">{c.icon}</span>
        <span>{status} — {c.label}</span>
      </div>
      <p className="text-sm mt-1 opacity-90">{message}</p>
      <p className="text-xs mt-1 opacity-70">Action: {action}</p>
    </div>
  );
}
