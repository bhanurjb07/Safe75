import CountUp from './CountUp.jsx';

/** "77.3%" with the whole number large and the decimals small, counting up. */
export default function BigPercent({ value, decimals = 1, className = '', delay = 0, duration = 1.3 }) {
  const rounded = Number((Number.isFinite(value) ? value : 0).toFixed(decimals));
  const whole = Math.trunc(rounded);
  const frac = decimals > 0 ? `.${rounded.toFixed(decimals).split('.')[1]}` : ''; // ".3"
  return (
    <span className={`inline-flex items-baseline font-extrabold tracking-tight ${className}`}>
      <CountUp value={whole} delay={delay} duration={duration} />
      <span className="text-[0.5em] tabular" aria-hidden="true">
        {frac}%
      </span>
      <span className="sr-only">{`${frac}%`}</span>
    </span>
  );
}
