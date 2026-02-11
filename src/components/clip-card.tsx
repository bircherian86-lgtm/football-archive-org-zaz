import Image from 'next/image';
import Link from 'next/link';
import { type Clip } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';
import { Session } from 'next-auth';

interface ClipCardProps {
  clip: Clip;
  className?: string;
  session: Session | null;
}

export function ClipCard({ clip, className, session }: ClipCardProps) {
  const { toast } = useToast();

  // Determine if user can delete this clip
  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const isAdmin = userRole === 'ADMIN';
  const isOwner = clip.userId && clip.userId === userId;
  const canDelete = isAdmin || isOwner;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this clip?')) return;

    try {
      const response = await fetch(`/api/clips/${clip.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Delete failed');
      }

      toast({
        title: 'Clip Deleted',
        description: 'The clip has been successfully removed.',
      });

      // Refresh the list
      mutate('/api/clips');
    } catch (error: any) {
      console.error('Error deleting clip:', error);
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'Could not delete the clip. Check permissions.',
      });
    }
  };

  // Parse tags (can be string or array)
  const tagArray = typeof clip.tags === 'string' ? clip.tags.split(',').filter(Boolean) : clip.tags || [];

  return (
    <Card className={cn("group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-lg shadow-xl shadow-black/40 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:-translate-y-1", className)}>
      <Link href={`/clip?clip=${clip.id}`} className="flex flex-1 flex-col">
        <CardHeader className="relative p-3">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={clip.thumbnailUrl}
              alt={clip.title}
              width={600}
              height={400}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="rounded-full bg-primary/20 p-3 backdrop-blur-md">
                <ExternalLink className="h-8 w-8 text-primary shadow-lg" />
              </div>
            </div>
            {canDelete && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between p-4 pt-0">
          <div>
            <h3 className="mb-2 line-clamp-2 font-headline text-lg font-bold text-foreground/90 transition-colors group-hover:text-primary">{clip.title}</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {tagArray.map((tag: string) => (
                <Badge key={tag.trim()} variant="secondary" className="bg-white/5 text-xs text-white/70">
                  #{tag.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <a href={clip.fileUrl} download={clip.title} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="outline" className="w-full border-white/10 bg-transparent hover:bg-white/5">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
