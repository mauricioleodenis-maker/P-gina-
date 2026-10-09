import type { Metadata } from 'next';
import { AdminShell } from '@/components/admin/shell';
import { getCurrentProfile } from '@/modules/auth/api';

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s | Panel Caromafla' },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name } = await getCurrentProfile(); // requireAdmin() dentro: segunda capa tras el middleware
  return <AdminShell name={name}>{children}</AdminShell>;
}
