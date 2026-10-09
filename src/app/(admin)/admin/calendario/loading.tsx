export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando calendario">
      <div className="h-9 w-48 animate-pulse rounded-md bg-surface" />
      <div className="h-[560px] animate-pulse rounded-lg bg-surface" />
    </div>
  );
}
