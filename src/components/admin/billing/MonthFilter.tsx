'use client';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui';

/** Filtro por mes (yyyy-MM) que actualiza el parametro `mes`. */
export function MonthFilter({ value, basePath }: { value: string; basePath: string }) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="mes" className="text-sm font-medium">Mes</label>
      <Input id="mes" type="month" defaultValue={value} className="w-44" onChange={(e) => router.push(e.target.value ? `${basePath}?mes=${e.target.value}` : basePath)} />
    </div>
  );
}
