// Title block at the top of the auth card.
export function AuthHeading({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="stack mb-6 gap-2">
      <h1 className="text-2xl md:text-3xl">{title}</h1>
      {children && <p className="meta">{children}</p>}
    </div>
  );
}
