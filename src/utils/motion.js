// Shared animation presets so motion feels consistent everywhere.

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const spring = { type: 'spring', stiffness: 420, damping: 32, mass: 0.8 };
export const softSpring = { type: 'spring', stiffness: 220, damping: 26 };

/** Container that staggers its children's "show" variant. */
export const stagger = (each = 0.06, delay = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: each, delayChildren: delay } },
});

export const fadeUp = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
};

export const page = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, scale: 0.99, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Hover lift + tap squish for cards and buttons. */
export const pressable = {
  whileHover: { y: -2, scale: 1.01 },
  whileTap: { scale: 0.97 },
  transition: spring,
};

export const tapOnly = { whileTap: { scale: 0.94 }, transition: spring };
