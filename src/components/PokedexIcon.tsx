export function PokedexIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* Red Pokédex casing */}
      <rect x="4" y="2" width="16" height="20" rx="3" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
      {/* Glowing blue camera lens */}
      <circle cx="8.5" cy="6.5" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
      {/* Mini LEDs */}
      <circle cx="13.5" cy="5.5" r="0.9" fill="#fca5a5" />
      <circle cx="16" cy="5.5" r="0.9" fill="#fde047" />
      <circle cx="18.5" cy="5.5" r="0.9" fill="#86efac" />
      {/* Screen */}
      <rect x="6.5" y="11" width="11" height="7" rx="1.2" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1" />
      {/* Screen scanline */}
      <line x1="8" y1="14.5" x2="16" y2="14.5" stroke="#38bdf8" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}
