export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#143F3A" />
      <path
        d="M8 22.5V14.2c0-.4.2-.7.5-.9L15.2 9c.5-.3 1.1-.3 1.6 0l6.7 4.3c.3.2.5.5.5.9v8.3"
        fill="none"
        stroke="#F3EFE8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M13 22.5v-5.2c0-.4.3-.7.7-.7h4.6c.4 0 .7.3.7.7v5.2"
        fill="none"
        stroke="#F3EFE8"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
