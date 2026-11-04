import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { KeepAlive } from '@/components/KeepAlive/KeepAlive';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MyScreen TV',
  description: 'Acompanhe suas séries e filmes favoritos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <KeepAlive />
        {children}
      </body>
    </html>
  );
}
