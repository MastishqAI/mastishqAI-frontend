/* icons — kept separate from components so React Fast Refresh works */
const I = (d, p = {}) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    {d}
  </svg>
);
export const Icon = {
  check: (p) => I(<path d="M20 6 9 17l-5-5" />, p),
  x: (p) => I(<path d="M18 6 6 18M6 6l12 12" />, p),
  eye: (p) => I(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>, p),
  eyeOff: (p) => I(<><path d="M17.9 17.9A10.6 10.6 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M1 1l22 22" /></>, p),
  mail: (p) => I(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>, p),
  chevDown: (p) => I(<path d="m6 9 6 6 6-6" />, p),
  bolt: (p) => I(<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />, p),
  search: (p) => I(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>, p),
  clock: (p) => I(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p),
  arrowUpRight: (p) => I(<path d="M7 17 17 7M8 7h9v9" />, p),
  flag: (p) => I(<path d="M4 22V4m0 0h13l-2 4 2 4H4" fill="currentColor" />, p),
  clip: (p) => I(<path d="m21 12-8.5 8.5a5 5 0 0 1-7-7L14 5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 8" />, p),
  mic: (p) => I(<><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v4" /></>, p),
  send: (p) => I(<path d="M12 19V5m0 0-6 6m6-6 6 6" />, p),
  plus: (p) => I(<path d="M12 5v14M5 12h14" />, p),
  pencil: (p) => I(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />, p),
  brain: (p) => I(<><path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1V4a3 3 0 0 0-2 0ZM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1V4a3 3 0 0 1 2 0Z" /></>, p),
  sparkle: (p) => I(<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />, p),
  xCircle: (p) => I(<><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6m0-6 6 6" /></>, p),
  chart: (p) => I(<path d="M3 3v18h18M7 14l3-3 3 3 5-6" />, p),
  trophy: (p) => I(<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />, p),
  target: (p) => I(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>, p),
  copy: (p) => I(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>, p),
  star: (p) => I(<path d="m12 2 3 6.9 7.5.6-5.7 4.9 1.8 7.3L12 17.8 5.4 21.7l1.8-7.3L1.5 9.5 9 8.9 12 2Z" />, p),
};

