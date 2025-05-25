// src/components/layout/Footer.tsx
// Updated to use Next.js Link
import Link from 'next/link';
import { BookOpen, Mail } from 'lucide-react';

const Footer = () => {
  // No client hooks used, so no "use client" needed
  return (
    <footer className="mt-auto border-t border-[#06D6A0]/20 bg-[#FEF7CD]/40 pt-16 pb-12">
      <div className="container mx-auto px-6">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Logo Column */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="mb-6 flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-[#8A4FFF]" />
              <span className="font-display text-xl font-bold text-[#4FB8FF]">
                StoryTime
              </span>
            </Link>
            <p className="mb-4 text-sm text-[#6b7280]">
              Create magical, personalized children's stories with AI assistance
              and bring them to life with your own voice.
            </p>
          </div>

          {/* Product Links Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#FF9F51]">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#how-it-works"
                  scroll
                  className="text-sm text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/create-story"
                  className="text-sm text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
                >
                  Create Story
                </Link>
              </li>
              <li>
                <Link
                  href="/stories"
                  className="text-sm text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
                >
                  Story Library
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@simpleappsgroup.com"
                  className="flex items-center space-x-1 text-sm text-[#6b7280] transition-colors hover:text-[#8A4FFF]"
                >
                  <Mail className="h-4 w-4" />
                  <span>Contact Us</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-[#06D6A0]/20 pt-8">
          <p className="text-center text-gray-400 text-sm mt-8">
            &copy; {new Date().getFullYear()} Storytime. All rights reserved. Let&apos;s make bedtime magical.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
