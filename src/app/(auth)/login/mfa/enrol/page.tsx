import { safeNext } from '@/modules/auth/redirect';
import { EnrolFlow } from './EnrolFlow';

export default async function EnrolPage({ searchParams }: { searchParams: Promise<{ recovered?: string; next?: string }> }) {
  const sp = await searchParams;
  return <EnrolFlow recovered={sp.recovered === '1'} next={safeNext(sp.next)} />;
}
