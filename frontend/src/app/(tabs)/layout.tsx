import { BottomNav } from '@/components/BottomNav/BottomNav';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="page-container">{children}</main>
      <BottomNav />
    </>
  );
}
