import { statusMeta, cn } from '../utils/status.js';

/** Status pill: icon + text, never color alone. */
export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const meta = statusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'chip border uppercase tracking-wider',
        // Danger is drawn as a solid red block so it stands out.
        status === 'danger' ? 'border-danger bg-danger text-white shadow-glow-red' : cn(meta.soft, meta.text, meta.border),
        size === 'lg' && 'px-3 py-1.5 text-sm',
        className,
      )}
    >
      <Icon className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function TypeBadge({ isLab }) {
  return (
    <span
      className={cn(
        'chip border',
        isLab ? 'border-a3/30 bg-a3/10 text-a3' : 'border-a1/30 bg-a1/10 text-a1',
      )}
    >
      {isLab ? 'Lab' : 'Theory'}
    </span>
  );
}
