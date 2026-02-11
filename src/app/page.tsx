'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { ClipCard } from '@/components/clip-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import useSWR from 'swr';
import type { Clip } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: session } = useSession();

  const { data: clips, isLoading } = useSWR<Clip[]>('/api/clips', fetcher);

  // Filter clips to only include those from the last 7 days
  const weeklyClips = useMemo(() => {
    if (!clips) return [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    return clips.filter(clip => {
      // Handle Unix timestamp (seconds)
      try {
        const uploadDate = new Date(clip.uploadDate * 1000);
        return uploadDate >= oneWeekAgo;
      } catch (e) {
        return false;
      }
    });
  }, [clips]);

  const trendingTags = useMemo(() => {
    if (!weeklyClips) return [];

    const tagCounts: { [key: string]: number } = {};

    weeklyClips.forEach(clip => {
      if (clip.tags) {
        const tagArray = typeof clip.tags === 'string' ? clip.tags.split(',') : clip.tags;
        tagArray.forEach(tag => {
          const normalizedTag = tag.toLowerCase().trim();
          if (normalizedTag) {
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [weeklyClips]);


  const filteredClips = useMemo(() => {
    if (!clips) return [];
    if (!searchTerm) return clips;
    const lowercasedTerm = searchTerm.toLowerCase();
    return clips.filter(clip => {
      const tagArray = typeof clip.tags === 'string' ? clip.tags.split(',') : clip.tags;
      return clip.title.toLowerCase().includes(lowercasedTerm) ||
        (tagArray && tagArray.some(tag => tag.toLowerCase().includes(lowercasedTerm)));
    });
  }, [searchTerm, clips]);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="rounded-xl bg-black/20 p-6 backdrop-blur-md">
          <h1 className="font-headline text-3xl font-bold tracking-tighter text-primary sm:text-4xl md:text-5xl lg:text-6xl/none">
            Football Clips Archive
          </h1>
          <p className="mt-4 max-w-[700px] text-foreground/70 md:text-xl">
            The ultimate destination for iconic football moments.
          </p>
        </div>
        <div className="relative mt-8 w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input
            type="search"
            placeholder="Search clips by player, team, skill..."
            className="h-12 rounded-full border border-border bg-black/30 pl-12 text-base backdrop-blur-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {!isLoading && trendingTags.length > 0 && (
        <div className="mb-12 flex flex-col items-center">
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-primary">
            Trending This Week
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {trendingTags.map(({ tag }) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer px-4 py-2 text-sm font-semibold capitalize transition-colors hover:bg-primary/20"
                onClick={() => setSearchTerm(tag)}
                data-interactive="true"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && filteredClips.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
          {filteredClips.map((clip) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              session={session}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && clips && filteredClips.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-24 text-center">
          <h3 className="text-2xl font-semibold tracking-tight text-primary">No clips found</h3>
          <p className="text-muted-foreground">Try a different search term or upload a new clip.</p>
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Card className="flex flex-col space-y-3 bg-transparent p-4">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </Card>
  )
}
