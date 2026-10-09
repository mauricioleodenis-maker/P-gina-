import { MfaForm } from './MfaForm';

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <MfaForm next={next} />;
}
