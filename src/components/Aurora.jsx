import { motion, useReducedMotion } from 'framer-motion';
import MatrixRain from './MatrixRain.jsx';

/**
 * Terminal background: black, a soft green glow, a grid, scanlines, a slow scan bar and a
 * vignette. `rain` adds falling code (login screen). `parallax` ({ x1, y1, x2, y2 } motion
 * values) shifts the glow with the cursor.
 */
export default function Aurora({ parallax, rain = false }) {
  const reduce = useReducedMotion();
  const move = (x, y) => (parallax && !reduce ? { x: parallax[x], y: parallax[y] } : undefined);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black">
      {rain && <MatrixRain opacity={0.28} />}
      <motion.div style={move('x1', 'y1')} className="absolute inset-0">
        <div
          className="aurora-blob animate-aurora-1"
          style={{
            width: '70vmax',
            height: '70vmax',
            left: '-25vmax',
            top: '-40vmax',
            background: 'radial-gradient(circle at center, rgb(0 255 102 / 0.16), transparent 62%)',
          }}
        />
      </motion.div>
      <motion.div style={move('x2', 'y2')} className="absolute inset-0">
        <div
          className="aurora-blob animate-aurora-2"
          style={{
            width: '55vmax',
            height: '55vmax',
            right: '-25vmax',
            bottom: '-35vmax',
            background: 'radial-gradient(circle at center, rgb(0 255 102 / 0.09), transparent 62%)',
          }}
        />
      </motion.div>
      <div className="bg-grid absolute inset-0" />
      <div className="scanbar absolute inset-x-0 top-0 animate-scan" />
      <div className="scanlines absolute inset-0" />
      <div className="vignette absolute inset-0" />
    </div>
  );
}
