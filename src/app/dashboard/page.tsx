// src/app/dashboard/page.tsx
'use client'; // Needed for hooks (useState, useEffect) and client-side data fetching (useQuery)

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Use Next.js Link
import { useAuth } from '@/context/AuthContext'; // Use Next.js compatible context
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

// Define a type for the story data for better type safety
type Story = {
  id: string;
  title: string | null;
  created_at: string;
  audio_url: string | null;
};

// Create QueryClient instance - If not already provided higher up in the tree (e.g., layout.tsx)
// If layout.tsx already has QueryClientProvider, you don't need it here.
// const queryClient = new QueryClient(); // Comment this out if layout.tsx provides it

export default function Dashboard() {
  // Use the auth context provided by the Next.js AuthProvider
  const { user, profile, loading: authLoading, supabase } = useAuth();
  const [isReadyToFetch, setIsReadyToFetch] = useState(false);

  // Effect to enable query only when auth is resolved and user is available
  useEffect(() => {
    if (!authLoading && user?.id) {
      console.log('[Dashboard] Auth loaded, user found. Ready to fetch stories.');
      setIsReadyToFetch(true);
    } else if (!authLoading && !user?.id) {
      console.log('[Dashboard] Auth loaded, no user found.');
      setIsReadyToFetch(false); // Explicitly set to false if no user
    }
  }, [authLoading, user?.id]);

  // Fetch stories using react-query
  const { data: stories, isLoading: storiesLoading, isError, error } = useQuery<Story[], Error>({
    queryKey: ['stories', user?.id], // Query key depends on user ID
    queryFn: async () => {
      // Ensure user ID is available before querying
      if (!user?.id) {
        console.log('[Dashboard QueryFn] No user ID, returning empty array.');
        return [];
      }
      console.log(`[Dashboard QueryFn] Fetching stories for user: ${user.id}`);

      // Use the supabase client instance from the AuthContext
      const { data, error: dbError } = await supabase
        .from('stories')
        .select('id, title, created_at, audio_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('[Dashboard QueryFn] Supabase error:', dbError);
        throw new Error(dbError.message || 'Failed to fetch stories');
      }
      console.log('[Dashboard QueryFn] Stories fetched:', data);
      return data || []; // Return data or empty array if null
    },
    enabled: isReadyToFetch, // Only run query when auth is ready and user exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });

  // Combine loading states
  const isLoading = authLoading || (isReadyToFetch && storiesLoading);

  // Determine usage info safely
  const minutesUsed = profile?.minutes_used_this_period ?? 0;
  const minutesLimit = profile?.monthly_minutes_limit ?? 0; // Use profile from useAuth

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
         <div className="container mx-auto px-6">
            <div className="space-y-4">
               <Skeleton className="h-8 w-1/2" />
               <Skeleton className="h-5 w-1/4" />
               <div className="flex justify-between items-center mb-4">
                 <Skeleton className="h-6 w-1/3" />
                 <Skeleton className="h-10 w-40" />
               </div>
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-20 w-full" />
            </div>
         </div>
      </div>
    );
  }

  // Render error state for story fetching
  if (isError) {
     return (
       <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-6 text-center text-red-600">
             <p>Error loading stories: {error?.message || 'Unknown error'}</p>
             <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
          </div>
       </div>
     );
  }

  // Main content render
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        {/* Welcome message uses profile/user data */}
        <h1 className="text-2xl font-bold mb-4">
          Welcome, {profile?.name || user?.email || 'Storyteller'}!
        </h1>

        {/* Usage Info */}
        {profile && minutesLimit > 0 && (
          <p className="text-sm text-muted-foreground mb-6">
            Usage this period: {minutesUsed} / {minutesLimit} minutes
          </p>
        )}

        {/* Button section */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Your Stories</h2>
          {/* Use Next.js Link */}
          <Link href="/create-story" passHref>
            <Button className="bg-[#4FB8FF] hover:bg-[#4FB8FF]/90"> {/* Updated color */}
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Story
            </Button>
          </Link>
        </div>

        {/* Story list rendering logic */}
        {stories && stories.length > 0 ? (
          <ul className="space-y-3">
            {stories.map((story: Story) => ( // Use the defined Story type
              <li key={story.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <p className="font-semibold text-lg text-gray-800">{story.title || 'Untitled Story'}</p>
                <p className="text-xs text-gray-500 mb-3">
                  Created {new Date(story.created_at).toLocaleDateString()}
                </p>
                {story.audio_url ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => window.open(story.audio_url ?? '', '_blank')}>Play</Button>
                    <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(story.audio_url ?? '')}>Copy Link</Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const a = document.createElement('a');
                      a.href = story.audio_url!;
                      a.download = `${story.title || 'story'}.mp3`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}>Download</Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No audio available yet.</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 border border-dashed rounded-lg">
             <p className="text-gray-500">You haven&apos;t created any stories yet.</p>
             <Link href="/create-story" className="mt-4 inline-block">
                <Button>Create your first story</Button>
             </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// If QueryClientProvider is NOT in layout.tsx, wrap export:
// export default function DashboardPage() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <Dashboard />
//     </QueryClientProvider>
//   );
// }