/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        'bg-2': token('bg-2'),
        card: token('card'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        line: token('line'),
        a1: token('a1'),
        a2: token('a2'),
        a3: token('a3'),
        safe: token('safe'),
        'safe-ink': token('safe-ink'),
        warn: token('warn'),
        'warn-ink': token('warn-ink'),
        danger: token('danger'),
        'danger-ink': token('danger-ink'),
        // Terminal theme: "white" is the ink used on solid green (accent buttons, avatars),
        // so text-white / bg-white render black. Keeps the UI to green and black only.
        white: token('on-accent'),
      },
      fontFamily: {
        sans: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      // Sharper, HUD-like corners everywhere.
      borderRadius: {
        lg: '0.3rem',
        xl: '0.375rem',
        '2xl': '0.45rem',
        '3xl': '0.55rem',
        '4xl': '0.7rem',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
        glow: '0 0 0 1px rgb(var(--a1) / 0.6), 0 0 24px -4px rgb(var(--a1) / 0.65)',
        'glow-safe': '0 0 32px -10px rgb(var(--safe) / 0.55)',
        'glow-warn': '0 0 32px -10px rgb(var(--warn) / 0.55)',
        'glow-danger': '0 0 0 1px rgb(var(--danger) / 0.35), 0 0 36px -8px rgb(var(--danger) / 0.6)',
        'glow-red': '0 0 14px -2px rgb(var(--danger) / 0.75)',
      },
      keyframes: {
        blink: {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.82' },
          '94%': { opacity: '1' },
          '97%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'aurora-1': {
          '0%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(8%,6%,0) scale(1.15)' },
          '100%': { transform: 'translate3d(-6%,10%,0) scale(0.95)' },
        },
        'aurora-2': {
          '0%': { transform: 'translate3d(0,0,0) scale(1.05)' },
          '50%': { transform: 'translate3d(-10%,-4%,0) scale(0.9)' },
          '100%': { transform: 'translate3d(6%,-8%,0) scale(1.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(6deg)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        blink: 'blink 1.05s steps(1) infinite',
        flicker: 'flicker 6s linear infinite',
        scan: 'scan 7s linear infinite',
        shimmer: 'shimmer 1.6s infinite',
        'aurora-1': 'aurora-1 22s ease-in-out infinite alternate',
        'aurora-2': 'aurora-2 26s ease-in-out infinite alternate',
        float: 'float 9s ease-in-out infinite',
        'spin-slow': 'spin-slow 24s linear infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
      },
    },
  },
  plugins: [],
};
