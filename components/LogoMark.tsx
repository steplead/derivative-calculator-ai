type LogoMarkProps = {
  className?: string;
};

/** Original mark: a quadratic arch and the tangent at its crest. */
const LogoMark = ({ className = 'h-9 w-9' }: LogoMarkProps) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="16" fill="var(--chip)" />
    <path d="M16 42Q32 2 48 42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M18 22H46" fill="none" stroke="var(--answer)" strokeWidth="3" strokeLinecap="round" />
    <circle cx="32" cy="22" r="3.2" fill="var(--answer)" />
  </svg>
);

export default LogoMark;
