'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, Video } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfile {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    profilePicture?: string;
    bannerImage?: string;
    bio?: string;
    createdAt: number;
}

interface Clip {
    id: string;
    title: string;
    thumbnailUrl: string;
    fileUrl: string;
    tags: string;
    uploadDate: number;
    featured: number;
}

export default function ProfilePage() {
    const params = useParams();
    const userId = params?.userId as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [clips, setClips] = useState<Clip[]>([]);
    const [stats, setStats] = useState({ totalUploads: 0, joinDate: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/user/${userId}`);
            if (!res.ok) throw new Error('User not found');

            const data = await res.json();
            setUser(data.user);
            setClips(data.clips);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="container py-12">
                <p className="text-center text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="container py-12">
                <p className="text-center text-muted-foreground">User not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Banner */}
            <div className="relative h-64 w-full overflow-hidden bg-gradient-to-r from-neutral-900 to-neutral-800">
                {user.bannerImage && (
                    <Image
                        src={user.bannerImage}
                        alt="Banner"
                        fill
                        className="object-cover"
                    />
                )}
            </div>

            {/* Profile Info */}
            <div className="container">
                <div className="relative -mt-16 mb-6">
                    <div className="flex items-end gap-6">
                        <Avatar className="h-32 w-32 border-4 border-black">
                            <AvatarImage src={user.profilePicture || undefined} alt={user.displayName || user.name || 'User'} />
                            <AvatarFallback className="bg-neutral-800 text-4xl">
                                {(user.displayName || user.name || user.email)?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="mb-4 flex-1">
                            <h1 className="text-3xl font-bold">{user.displayName || user.name || 'User'}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>

                    {user.bio && (
                        <p className="mt-4 text-sm">{user.bio}</p>
                    )}

                    <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            <span>{stats.totalUploads} uploads</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {formatDate(stats.joinDate)}</span>
                        </div>
                    </div>
                </div>

                {/* Clips Grid */}
                <div>
                    <h2 className="mb-6 text-2xl font-bold">Uploads</h2>
                    {clips.length === 0 ? (
                        <p className="text-muted-foreground">No uploads yet</p>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {clips.map((clip) => (
                                <Link key={clip.id} href={`/clip?clip=${clip.id}`}>
                                    <Card className="group cursor-pointer overflow-hidden border-neutral-800 bg-neutral-900/50 transition-all hover:border-primary">
                                        <div className="relative aspect-video overflow-hidden">
                                            <Image
                                                src={clip.thumbnailUrl}
                                                alt={clip.title}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                            />
                                            {clip.featured === 1 && (
                                                <Badge className="absolute right-2 top-2 bg-primary">Featured</Badge>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="line-clamp-2 font-semibold">{clip.title}</h3>
                                            {clip.tags && (
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {clip.tags.split(',').slice(0, 3).map((tag, idx) => (
                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                            {tag.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-2 text-xs text-muted-foreground">
                                                {new Date(clip.uploadDate * 1000).toLocaleDateString()}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
