// src/app/not-found.tsx
// Updated for Next.js: Removed client hooks and uses next/link.
import Link from 'next/link'; // Use Next.js Link

// No "use client" needed as we removed the hooks. This can be a Server Component.
export default function NotFound() {
  // No need to log the path here; Next.js handles triggering this page.
  // Server-side logging or analytics can track 404s if needed.

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-2xl text-gray-600 mb-8">Oops! Page Not Found</p>
        <p className="text-gray-500 mb-8">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="px-6 py-3 bg-[#4FB8FF] text-white font-semibold rounded-md hover:bg-[#4FB8FF]/90 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
}