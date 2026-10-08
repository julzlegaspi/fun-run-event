// One headline number in the dashboard's KPI row.
export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5">
      <dt className="meta">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-ink md:text-3xl">
        {value}
      </dd>
      {note && <dd className="meta mt-1 text-xs">{note}</dd>}
    </div>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {children}
    </dl>
  );
}
