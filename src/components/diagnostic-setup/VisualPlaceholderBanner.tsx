export function VisualPlaceholderBanner({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span className="font-medium">Visual placeholder only</span>
      <span className="text-amber-800"> — {label}. No Prisma model exists yet for this screen.</span>
    </div>
  );
}
