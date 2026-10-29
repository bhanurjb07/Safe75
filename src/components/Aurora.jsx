import { motion, useReducedMotion } from 'framer-motion';

/**
 * Slowly drifting gradient-mesh background. Only transforms animate, so it stays cheap.
 * `parallax` is an optional pair of motion values ({ x, y }) for the login page.
 */
export default function Aurora({ parallax, intense = false }) {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-bg" />
      <motion.div style={parallax && !reduce ? { x: parallax.x1, y: parallax.y1 } : undefined} className="absolute inset-0">
        <div
          className="aurora-blob animate-aurora-1"
          style={{
            width: '60vmax',
            height: '60vmax',
            left: '-18vmax',
            top: '-22vmax',
            background: 'radial-gradient(circle at center, rgb(var(--a1) / 0.55), transparent 62%)',
          }}
        />
        <div
          className="aurora-blob animate-aurora-2"
          style={{
            width: '52vmax',
            height: '52vmax',
            right: '-16vmax',
            top: '-8vmax',
            background: 'radial-gradient(circle at center, rgb(var(--a2) / 0.45), transparent 62%)',
          }}
        />
      </motion.div>
      <motion.div style={parallax && !reduce ? { x: parallax.x2, y: parallax.y2 } : undefined} className="absolute inset-0">
        <div
          className="aurora-blob animate-aurora-2"
          style={{
            width: '48vmax',
            height: '48vmax',
            left: '20vmax',
            bottom: '-30vmax',
            background: `radial-gradient(circle at center, rgb(var(--a3) / ${intense ? 0.4 : 0.28}), transparent 62%)`,
          }}
        />
      </motion.div>
      <div className="bg-grid absolute inset-0" />
      <div className="noise absolute inset-0" />
    </div>
  );
}
