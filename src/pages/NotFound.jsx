import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fadeUp } from '../utils/motion.js';

export default function NotFound() {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp} className="card card-pad mx-auto mt-10 max-w-md py-12 text-center">
      <motion.div
        animate={{ rotate: [0, 20, -15, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 1 }}
        className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-a2/15 text-a2"
      >
        <Compass className="h-8 w-8" aria-hidden="true" />
      </motion.div>
      <h1 className="text-xl font-bold">This page skipped class</h1>
      <p className="mt-1 text-sm text-muted">We couldn't find what you were looking for.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </motion.div>
  );
}
