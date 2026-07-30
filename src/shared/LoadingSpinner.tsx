export default function LoadingSpinner() {
  return (
    <div
      role="status"
      className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
