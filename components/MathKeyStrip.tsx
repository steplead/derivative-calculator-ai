'use client';

const KEYS = [
  { label: 'x²', insert: 'x^2', name: 'Insert x squared' },
  { label: '√', insert: 'sqrt(', name: 'Insert square root' },
  { label: 'sin', insert: 'sin(', name: 'Insert sine' },
  { label: 'ln', insert: 'ln(', name: 'Insert natural log' },
  { label: 'π', insert: 'pi', name: 'Insert pi' },
] as const;

type MathKeyStripProps = {
  onInsert: (_snippet: string) => void;
};

const MathKeyStrip = ({ onInsert }: MathKeyStripProps) => (
  <div className="symbol-strip" role="toolbar" aria-label="Math symbols">
    {KEYS.map((key) => (
      <button
        key={key.label}
        type="button"
        className="symbol-key"
        aria-label={key.name}
        onClick={() => onInsert(key.insert)}
      >
        {key.label}
      </button>
    ))}
  </div>
);

export default MathKeyStrip;
