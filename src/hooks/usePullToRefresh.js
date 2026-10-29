import { animate, useMotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/** Touch pull-down-to-refresh at the top of the page. Returns a motion value for the pull distance. */
export function usePullToRefresh(onRefresh, { threshold = 72, max = 120 } = {}) {
  const y = useMotionValue(0);
  const [armed, setArmed] = useState(false);
  const cb = useRef(onRefresh);
  cb.current = onRefresh;

  useEffect(() => {
    let startY = null;
    let busy = false;

    const start = (e) => {
      // Not while a modal locks the page, and only from the very top.
      startY = !busy && window.scrollY <= 0 && e.touches.length === 1 && document.body.style.overflow !== 'hidden' ? e.touches[0].clientY : null;
    };
    const move = (e) => {
      if (startY == null) return;
      const d = e.touches[0].clientY - startY;
      if (d <= 0 || window.scrollY > 0) {
        y.set(0);
        return;
      }
      const v = Math.min(max, d * 0.5);
      y.set(v);
      setArmed(v >= threshold);
    };
    const end = async () => {
      if (startY == null) return;
      startY = null;
      if (y.get() >= threshold) {
        busy = true;
        animate(y, 56, { type: 'spring', stiffness: 400, damping: 30 });
        try {
          await cb.current();
        } finally {
          busy = false;
        }
      }
      setArmed(false);
      animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
    };

    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
      window.removeEventListener('touchcancel', end);
    };
  }, [y, threshold, max]);

  return { y, armed };
}
