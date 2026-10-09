export default function Loading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando solicitudes">
      {[0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-lg bg-surface" />)}
    </div>
  );
}
