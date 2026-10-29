import { useMemo } from 'react';
import { useThemeStore } from '../store/themeStore.js';

const read = (name) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
  return v ? `rgb(${v.split(/\s+/).join(',')})` : '#888';
};

/** Resolved theme colors for SVG/Recharts attributes, which can't use CSS variables. */
export function useThemeColors() {
  const resolved = useThemeStore((s) => s.resolved);
  return useMemo(
    () => ({
      fg: read('fg'),
      muted: read('muted'),
      subtle: read('subtle'),
      line: read('line'),
      a1: read('a1'),
      a2: read('a2'),
      a3: read('a3'),
      resolved,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolved],
  );
}
