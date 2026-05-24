import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'ReviewLens',
  description: 'Search Reddit product discussions and uncover sentiment insights from real posts and comments.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
