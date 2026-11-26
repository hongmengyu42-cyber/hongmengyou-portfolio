/** First focusable element: lets keyboard users jump past the header straight to the content. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only rounded-control bg-btn px-4 py-2 font-medium text-btn-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
    >
      Skip to content
    </a>
  );
}
