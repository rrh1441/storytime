import "./globals.css";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import SupabaseProvider from "@/components/supabase-provider";
import { getUser } from "@/lib/supabase";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StoryTime – AI-Generated Children’s Books",
  description: "Create personalised kids’ stories in seconds, with audio narration.",
  robots: "all",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { user } = await getUser();
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SupabaseProvider>
          <Navbar user={user} />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
