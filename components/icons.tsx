export function IconSearch({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 10.2 13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlay({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.2 3.4v9.2L12.6 8 5.2 3.4Z" fill="currentColor" />
    </svg>
  );
}

export function IconPause({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 3.2h2.2v9.6H4.5V3.2Zm4.8 0h2.2v9.6H9.3V3.2Z" fill="currentColor" />
    </svg>
  );
}
