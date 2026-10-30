import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

// Full class strings (not built dynamically) so Tailwind keeps them.
export const STATUS = {
  safe: {
    label: 'Safe',
    headline: "You're safe",
    icon: ShieldCheck,
    hex: '#00ff66',
    hex2: '#96ffbe',
    text: 'text-safe-ink',
    bg: 'bg-safe',
    soft: 'bg-safe/10',
    border: 'border-safe/30',
    glow: 'shadow-glow-safe',
    tone: 'var(--safe)',
  },
  borderline: {
    label: 'Borderline',
    headline: 'On the edge',
    icon: AlertTriangle,
    hex: '#ffb000',
    hex2: '#ffd166',
    text: 'text-warn-ink',
    bg: 'bg-warn',
    soft: 'bg-warn/10',
    border: 'border-warn/30',
    glow: 'shadow-glow-warn',
    tone: 'var(--warn)',
  },
  danger: {
    label: 'Danger',
    headline: 'Danger zone',
    icon: ShieldAlert,
    hex: '#ff3b4a',
    hex2: '#ff7a85',
    text: 'text-danger-ink',
    bg: 'bg-danger',
    soft: 'bg-danger/10',
    border: 'border-danger/30',
    glow: 'shadow-glow-danger',
    tone: 'var(--danger)',
  },
};

export const statusMeta = (status) => STATUS[status] ?? STATUS.safe;

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;
