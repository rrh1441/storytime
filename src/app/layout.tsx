// src/app/layout.tsx
import './globals.css';
import React, { ReactNode } from 'react'; // Use React import
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ClientProviders } from './providers';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
 title: 'StoryTime - AI-Generated Children\'s Books',
 description: 'Create personalised kids\' stories in seconds, with audio narration.',
 robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
 return (
  <html lang="en" className={inter.className}>
   <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
    <ClientProviders>{children}</ClientProviders>
   </body>
  </html>
 );
}