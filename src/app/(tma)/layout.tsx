import { AppShell } from '@/components/layout/AppShell';

export default function TMALayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
