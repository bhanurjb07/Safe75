import { useId } from 'react';

/** Native range input with a filled gradient track. Keyboard accessible by default. */
export default function RangeSlider({ label, value, min = 0, max = 30, step = 1, onChange, tone = 'var(--a2)', suffix = '' }) {
  const id = useId();
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-muted">
          {label}
        </label>
        <span className="tabular text-lg font-bold">
          {value}
          <span className="ml-1 text-xs font-medium text-subtle">{suffix}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--fill': `${fill}%`, '--tone': tone }}
        aria-valuetext={`${value} ${suffix}`}
      />
      <div className="flex justify-between text-[11px] text-subtle tabular" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
