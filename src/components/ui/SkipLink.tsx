export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-50
        bg-boston-gold text-boston-navy
        px-4 py-2 rounded
        focus:outline-none focus:ring-2 focus:ring-boston-cream
      "
    >
      Skip to main content
    </a>
  );
}
