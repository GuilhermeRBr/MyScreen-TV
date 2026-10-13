import { BottomNav } from '@/components/BottomNav/BottomNav';
import styles from './layout.module.css';

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <BottomNav />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
