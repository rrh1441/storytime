// src/components/layout/Navbar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BookOpen, Menu, Tag, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  // Debug auth state on mount / update
  useEffect(() => {
    console.log('[Navbar] Auth State — Loading:', loading, 'User:', !!user);
  }, [loading, user]);

  // Close mobile menu on resize ≥ 768 px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    setIsMenuOpen(false); // ensure closed on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);
      const { error } = await logout();
      if (error) {
        console.error('Logout failed:', error);
      } else {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed (catch):', err);
    }
  };

  const closeMobileMenu = () => setIsMenuOpen(false);

  return (
    <nav className="sticky top-0 z-40 bg-white px-6 py-4 shadow-sm md:px-8">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2" onClick={closeMobileMenu}>
          <BookOpen className="h-8 w-8 text-[#8A4FFF]" />
          <span className="font-display text-2xl font-bold text-[#4FB8FF]">StoryTime</span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden items-center space-x-6 md:flex lg:space-x-8">
          <Link
            href="/#how-it-works"
            scroll
            className="font-medium text-gray-600 transition-colors hover:text-[#8A4FFF]"
          >
            How It Works
          </Link>

          <Link
            href="/pricing"
            className="flex items-center gap-1 font-medium text-gray-600 transition-colors hover:text-[#8A4FFF]"
          >
            <Tag className="h-4 w-4" /> Pricing
          </Link>

          {user && !loading ? (
            <>
              <Link
                href="/dashboard"
                className="font-medium text-gray-600 transition-colors hover:text-[#8A4FFF]"
              >
                Dashboard
              </Link>
              <Button
                variant="outline"
                className="h-9 rounded-full border-[#FF9F51] px-4 font-medium text-[#FF9F51] hover:bg-[#FF9F51]/10"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : !loading ? (
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button
                  variant="outline"
                  className="h-9 rounded-full border-gray-300 px-4 font-medium hover:border-[#8A4FFF] hover:text-[#8A4FFF]"
                >
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="h-9 rounded-full bg-[#4FB8FF] px-4 font-medium text-white shadow-sm hover:bg-[#4FB8FF]/90">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          ) : null}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="p-1 md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="absolute left-0 top-[69px] z-30 w-full border-t border-gray-100 bg-white shadow-md md:hidden">
          <div className="flex flex-col space-y-5 p-6">
            <Link
              href="/#how-it-works"
              scroll
              className="text-lg font-medium text-gray-700 hover:text-[#8A4FFF]"
              onClick={closeMobileMenu}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-[#8A4FFF]"
              onClick={closeMobileMenu}
            >
              <Tag className="h-5 w-5" /> Pricing
            </Link>

            {user && !loading ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-lg font-medium text-gray-700 hover:text-[#8A4FFF]"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Button
                  variant="outline"
                  className="w-full rounded-full border-[#FF9F51] font-medium text-[#FF9F51] hover:bg-[#FF9F51]/10"
                  onClick={handleLogout}
                >
                  Log Out
                </Button>
              </>
            ) : !loading ? (
              <div className="space-y-4 pt-4">
                <Link href="/login" onClick={closeMobileMenu}>
                  <Button className="w-full rounded-full font-medium" variant="outline">
                    Log in
                  </Button>
                </Link>
                <Link href="/signup" onClick={closeMobileMenu}>
                  <Button className="w-full rounded-full bg-[#4FB8FF] font-medium text-white hover:bg-[#4FB8FF]/90">
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
