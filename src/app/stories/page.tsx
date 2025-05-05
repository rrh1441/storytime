// src/app/stories/page.tsx
'use client'; // Required for useState hook

import { useState } from 'react';
import Link from 'next/link'; // Use Next.js Link
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from '@/components/ui/select';
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Plus, BookOpen } from 'lucide-react';
import StoryCard from '@/components/stories/StoryCard'; // Assumes StoryCard is correctly updated

// Mock data for stories - TODO: Replace with actual data fetching
const allStories = [
 {
  id: '1',
  title: 'The Adventures of Luna the Brave',
  coverImage: 'https://images.unsplash.com/photo-1619532550766-12c525d012bc?q=80&w=1587&auto=format&fit=crop',
  ageRange: 'Ages 4-8',
  duration: '5 min',
  isNew: true
 },
 {
  id: '2',
  title: 'The Magical Forest Friends',
  coverImage: 'https://images.unsplash.com/photo-1633613286848-e6f43bbafb8d?q=80&w=1470&auto=format&fit=crop',
  ageRange: 'Ages 3-6',
  duration: '4 min'
 },
 {
  id: '3',
  title: 'Captain Finn\'s Ocean Adventure',
  coverImage: 'https://images.unsplash.com/photo-1535381273077-21e815afe1ce?q=80&w=1587&auto=format&fit=crop',
  ageRange: 'Ages 5-9',
  duration: '6 min'
 },
 // Add more mock stories if needed...
];

// Note: Removed React.FC for simpler default export
export default function StoryLibrary() {
 const [searchTerm, setSearchTerm] = useState('');
 // TODO: Add state for other filters (sort, age, theme) if implementing filtering logic

 // Filter stories based on search term (using mock data)
 // TODO: Adapt this if using actual data fetching/server-side filtering
 const filteredStories = allStories.filter(story =>
  story.title.toLowerCase().includes(searchTerm.toLowerCase())
 );

 return (
  <div className="min-h-screen bg-[#F9FAFC] py-12"> {/* Use theme background */}
   <div className="container mx-auto px-6">
    <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
     <h1 className="text-3xl font-bold text-gray-800">Story Library</h1>
     {/* Use Next.js Link */}
     <Link href="/create-story" passHref>
      <Button className="bg-[#8A4FFF] hover:bg-[#7a3dff] text-white flex items-center"> {/* Use theme color */}
       <Plus className="h-4 w-4 mr-2" />
       Create New Story
      </Button>
     </Link>
    </div>

    <Tabs defaultValue="all" className="space-y-6">
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <TabsList className="bg-white shadow-sm">
       <TabsTrigger value="all">All Stories</TabsTrigger>
       <TabsTrigger value="your">Your Stories</TabsTrigger>
       <TabsTrigger value="favorites">Favorites</TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-3 w-full sm:w-auto">
       <div className="relative flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
         placeholder="Search stories..."
         className="pl-9 w-full sm:w-[250px]"
         value={searchTerm}
         onChange={(e) => setSearchTerm(e.target.value)}
        />
       </div>

       {/* TODO: Implement filter logic trigger */}
       <Button variant="outline" size="icon" className="bg-white">
         <Filter className="h-4 w-4 text-gray-600" />
         <span className="sr-only">Filters</span>
       </Button>
      </div>
     </div>

     <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Filter/Sort Controls inside the main content area */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-y-4">
       <div className="flex items-center space-x-3">
        <p className="text-sm text-gray-600">
         <span className="font-medium text-black">{filteredStories.length}</span> stories found
        </p>
       </div>
       <div className="flex flex-wrap gap-3">
        <Select defaultValue="newest">
         <SelectTrigger className="w-full sm:w-[160px] text-xs h-9">
          <SelectValue placeholder="Sort by" />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="a-z">A-Z</SelectItem>
          <SelectItem value="z-a">Z-A</SelectItem>
         </SelectContent>
        </Select>
        <Select defaultValue="all-ages">
         <SelectTrigger className="w-full sm:w-[130px] text-xs h-9">
          <SelectValue placeholder="Age Range" />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="all-ages">All Ages</SelectItem>
          <SelectItem value="0-3">0-3 years</SelectItem>
          <SelectItem value="4-6">4-6 years</SelectItem>
          <SelectItem value="7-10">7-10 years</SelectItem>
         </SelectContent>
        </Select>
        <Select defaultValue="all-themes">
         <SelectTrigger className="w-full sm:w-[130px] text-xs h-9">
          <SelectValue placeholder="Theme" />
         </SelectTrigger>
         <SelectContent>
          <SelectItem value="all-themes">All Themes</SelectItem>
          <SelectItem value="adventure">Adventure</SelectItem>
          <SelectItem value="fantasy">Fantasy</SelectItem>
          <SelectItem value="animals">Animals</SelectItem>
          <SelectItem value="space">Space</SelectItem>
         </SelectContent>
        </Select>
       </div>
      </div>

      {/* Tabs Content */}
      <TabsContent value="all">
       {filteredStories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredStories.map((story) => (
          <StoryCard
           key={story.id}
           id={story.id}
           title={story.title}
           coverImage={story.coverImage}
           ageRange={story.ageRange}
           duration={story.duration}
           isNew={story.isNew}
          />
         ))}
        </div>
       ) : (
        <div className="text-center py-16">
         <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
         <h3 className="text-xl font-semibold mb-2 text-gray-700">No stories found</h3>
         <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
        </div>
       )}
      </TabsContent>

      {/* TODO: Implement actual data fetching for "Your Stories" and "Favorites" */}
      <TabsContent value="your">
       <div className="text-center py-16">
         <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
         <h3 className="text-xl font-semibold mb-2 text-gray-700">Your Stories</h3>
         <p className="text-gray-500 mb-6">Stories you have created will appear here.</p>
         {/* Display subset of mock data for now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredStories.slice(0, 3).map((story) => (
               <StoryCard key={story.id} {...story} />
             ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="favorites">
       <div className="text-center py-16">
         <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
         <h3 className="text-xl font-semibold mb-2 text-gray-700">Favorites</h3>
         <p className="text-gray-500 mb-6">Your favorite stories will appear here.</p>
          {/* Display subset of mock data for now */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredStories.slice(1, 3).map((story) => (
               <StoryCard key={story.id} {...story} />
             ))}
          </div>
        </div>
      </TabsContent>
     </div>

     {/* TODO: Implement Load More logic */}
     <div className="flex justify-center mt-8">
      <Button variant="outline" className="mx-auto">Load More Stories</Button>
     </div>
    </Tabs>
   </div>
  </div>
 );
}