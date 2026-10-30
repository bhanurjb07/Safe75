import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const GLYPHS = '01アイウエオカキクケコサシスセソタチツテト<>/{}[]$#%&*+=75';

/**
 * Falling green glyphs on a canvas. Kept cheap for phones: ~18 fps, device-pixel-ratio 1,
 * paused while the tab is hidden, and not rendered at all for reduced-motion users.
 */
export default function MatrixRain({ opacity = 0.35, fontSize = 15 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return undefined;
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    let drops = [];
    let raf = 0;
    let last = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cols = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: cols }, () => Math.floor((Math.random() * canvas.height) / fontSize));
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const frame = (t) => {
      raf = requestAnimationFrame(frame);
      if (document.hidden || t - last < 55) return;
      last = t;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "JetBrains Mono Variable", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
        const y = drops[i] * fontSize;
        // Leading glyph brighter than the trail.
        ctx.fillStyle = Math.random() > 0.96 ? '#c8ffdc' : '#00ff66';
        ctx.fillText(ch, i * fontSize, y);
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        else drops[i]++;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [reduce, fontSize]);

  if (reduce) return null;
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" style={{ opacity }} />;
}
