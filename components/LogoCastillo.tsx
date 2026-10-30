// Logo provisional del castillo. Se reemplaza por el logo real cuando lo tengamos en SVG.
export function LogoCastillo({ className = "h-20 w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
        <path d="M8 58V22h8v6h6v-6h8v6h4v-6h8v6h6v-6h8v36Z" />
        <path d="M26 58V44a6 6 0 0 1 12 0v14" />
        <path d="M16 36h4M44 36h4" />
        <path d="M32 6v12M32 6l8 3-8 3" />
      </g>
    </svg>
  );
}
