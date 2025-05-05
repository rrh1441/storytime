import './globals.css';
import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';

import { AuthProvider } from '@/context/AuthContext';    // fresh SSR-based context
import Navbar from '@/components/Navbar';                // client component

/* -------------------------------------------------------------------------- */
/*  Fonts                                                                     */
/* -------------------------------------------------------------------------- */
const inter = Inter({ subsets: ['latin'], display: 'swap' });

/* -------------------------------------------------------------------------- */
/*  Metadata (static object)                                                  */
/* -------------------------------------------------------------------------- */
export const metadata: Metadata = {
  title: 'StoryTime – AI-Generated Children’s Books',
  description: 'Create personalised kids’ stories in seconds, with audio narration.',
  robots: { index: true, follow: true },
};

/* -------------------------------------------------------------------------- */
/*  Root layout – Server Component (default)                                  */
/* -------------------------------------------------------------------------- */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* Client-side auth context hydrates after initial paint */}
        <AuthProvider>
          {/* Navbar will render logged-out by default and update once auth hydrates */}
          <Navbar serverUser={null} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
