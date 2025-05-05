// src/components/stories/StoryCard.tsx
// Updated to use Next.js Link
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryCardProps {
  id: string;
  title: string;
  coverImage: string; // URL string
  ageRange: string;
  duration: string;
  isNew?: boolean;
}

const StoryCard = ({
  id,
  title,
  coverImage,
  ageRange,
  duration,
  isNew = false,
}: StoryCardProps) => {
  // No client hooks used
  return (
    <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          fill
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isNew && (
          <div className="absolute right-3 top-3 z-10 rounded-full bg-[#EF476F] py-1 px-2 text-xs font-bold text-white">
            NEW
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-grow flex-col p-4">
        <h3 className="mb-2 line-clamp-1 text-lg font-bold text-gray-800">
          {title}
        </h3>

        <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{ageRange}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{duration}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <Link href={`/story/${id}`}>
            <Button
              variant="ghost"
              className="p-0 text-sm text-[#8A4FFF] hover:text-[#8A4FFF]/90"
            >
              Read Story
            </Button>
          </Link>

          <Link href={`/story/${id}/play`}>
            <Button
              variant="ghost"
              className="flex items-center space-x-1 p-0 text-sm text-[#8A4FFF] hover:text-[#8A4FFF]/90"
            >
              <PlayCircle className="h-5 w-5" />
              <span>Play</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
