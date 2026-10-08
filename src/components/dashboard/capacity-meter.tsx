import { percent } from "@/lib/dashboard";

// Sold vs capacity. Paid spots fill in brand, pending ones in a lighter step
// of the same hue on a brand-soft track; the numbers are always printed too.
export function CapacityMeter({
  sold,
  pending,
  capacity,
  label,
}: {
  sold: number;
  pending: number;
  capacity: number;
  label: string;
}) {
  const soldPct = percent(sold, capacity);
  const pendingPct = Math.min(100 - soldPct, percent(pending, capacity));
  return (
    <div className="stack gap-1.5">
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={sold}
        aria-valuetext={`${sold} of ${capacity} sold${pending ? `, ${pending} awaiting payment` : ""}`}
        title={`${sold} sold · ${pending} pending · ${capacity} capacity`}
        className="flex h-2 overflow-hidden rounded-full bg-brand-soft"
      >
        <span className="h-full rounded-full bg-brand" style={{ width: `${soldPct}%` }} />
        {pendingPct > 0 && (
          <span
            className="h-full rounded-r-full bg-brand/40"
            style={{ width: `${pendingPct}%` }}
          />
        )}
      </div>
      <p className="meta text-xs">
        {sold} / {capacity} sold{pending ? ` · ${pending} pending` : ""}
      </p>
    </div>
  );
}
