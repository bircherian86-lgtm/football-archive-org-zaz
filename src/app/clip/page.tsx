'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, ArrowLeft } from 'lucide-react';
import { CommentSection } from '@/components/comments/comment-section';
import Link from 'next/link';
import Image from 'next/image';

interface Clip {
    id: string;
    title: string;
    thumbnailUrl: string;
    fileUrl: string;
    fileName: string;
    tags: string;
    userId: string;
    uploadDate: number;
    featured: number;
    uploader?: {
        id: string;
        email: string;
        displayName?: string;
        name?: string;
        profilePicture?: string;
    };
}

function ClipDetailContent() {
    const searchParams = useSearchParams();
    const clipId = searchParams?.get('clip');

    const [clip, setClip] = useState<Clip | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clipId) {
            fetchClip();
        } else {
            setLoading(false);
        }
    }, [clipId]);

    const fetchClip = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clips/${clipId}`);
            if (!res.ok) throw new Error('Failed to fetch clip');

            const data = await res.json();
            setClip(data.clip);
        } catch (error) {
            console.error('Error fetching clip:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (clip) {
            const link = document.createElement('a');
            link.href = clip.fileUrl;
            link.download = clip.fileName || 'video.mp4';
            link.click();
        }
    };

    if (!clipId) {
        return null;
    }

    if (loading) {
        return (
            <div className="container py-12">
                <p className="text-center text-muted-foreground">Loading clip...</p>
            </div>
        );
    }

    if (!clip) {
        return (
            <div className="container py-12">
                <p className="text-center text-muted-foreground">Clip not found</p>
            </div>
        );
    }

    return (
        <div className="container max-w-6xl py-8">
            <Link href="/">
                <Button variant="ghost" className="mb-4 gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Home
                </Button>
            </Link>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player */}
                    <Card className="overflow-hidden border-neutral-800 bg-neutral-900/50">
                        <video
                            src={clip.fileUrl}
                            controls
                            className="w-full aspect-video bg-black"
                            poster={clip.thumbnailUrl}
                        />
                    </Card>

                    {/* Clip Info */}
                    <div>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold">{clip.title}</h1>
                                {clip.tags && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {clip.tags.split(',').map((tag, idx) => (
                                            <Badge key={idx} variant="outline">
                                                {tag.trim()}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Button onClick={handleDownload} className="gap-2">
                                <Download className="h-4 w-4" />
                                Download
                            </Button>
                        </div>

                        {/* Uploader Info */}
                        {clip.uploader && (
                            <Link href={`/profile/${clip.uploader.id}`}>
                                <div className="mt-6 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 p-4 transition-colors hover:bg-neutral-800/50">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={clip.uploader.profilePicture || undefined} alt={clip.uploader.displayName || clip.uploader.name || 'User'} />
                                        <AvatarFallback className="bg-neutral-800">
                                            {(clip.uploader.displayName || clip.uploader.name || clip.uploader.email)?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{clip.uploader.displayName || clip.uploader.name || 'User'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Uploaded {new Date(clip.uploadDate * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>

                    {/* Comments */}
                    <CommentSection clipId={clip.id} />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="border-neutral-800 bg-neutral-900/50">
                        <CardContent className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Upload Date</p>
                                <p className="font-semibold">
                                    {new Date(clip.uploadDate * 1000).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            {clip.featured === 1 && (
                                <div>
                                    <Badge className="bg-primary">Featured Clip</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ClipDetailPage() {
    return (
        <Suspense fallback={<div className="container py-12"><p className="text-center text-muted-foreground">Loading...</p></div>}>
            <ClipDetailContent />
        </Suspense>
    );
}
