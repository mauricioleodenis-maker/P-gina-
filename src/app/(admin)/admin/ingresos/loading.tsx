export default function Loading() {
  return (
    <div className="grid gap-4" role="status" aria-label="Cargando ingresos">
      <div className="h-9 w-48 animate-pulse rounded-md bg-sand/60" />
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-lg bg-sand/40" />)}</div>
      <div className="h-72 animate-pulse rounded-lg bg-sand/40" />
    </div>
  );
}
