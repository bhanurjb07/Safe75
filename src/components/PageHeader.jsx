import { motion } from 'framer-motion';
import { EASE_OUT } from '../utils/motion.js';

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </motion.header>
  );
}
