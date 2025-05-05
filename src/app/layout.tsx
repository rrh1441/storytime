// src/app/layout.tsx
import './globals.css';
import React, { ReactNode } from 'react'; // Use React import
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster'; // Keep Shadcn toaster
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/layout/Navbar'; // Use updated Navbar from layout
import Footer from '@/components/layout/Footer'; // Import the Footer

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
 title: 'StoryTime – AI-Generated Children’s Books',
 description: 'Create personalised kids’ stories in seconds, with audio narration.',
 robots: { index: true, follow: true },
};

// Create QueryClient instance outside component for persistence
const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: ReactNode }) {
 return (
  <html lang="en" className={inter.className}>
   <body className="min-h-screen flex flex-col bg-background text-foreground antialiased">
    <QueryClientProvider client={queryClient}>
     <TooltipProvider>
      <AuthProvider>
       <Navbar /> {/* Uses useAuth internally */}
       <main className="flex-grow">{children}</main>
       <Footer /> {/* Render Footer */}
       <ShadcnToaster /> {/* Include only the Shadcn toaster */}
      </AuthProvider>
     </TooltipProvider>
    </QueryClientProvider>
   </body>
  </html>
 );
}