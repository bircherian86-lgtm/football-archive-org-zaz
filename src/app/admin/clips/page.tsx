'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Trash2, Star, StarOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface Clip {
    id: string;
    title: string;
    thumbnailUrl: string;
    fileUrl: string;
    tags: string;
    featured: number;
    uploadDate: number;
    userId: string;
}

export default function ClipsPage() {
    const [clips, setClips] = useState<Clip[]>([]);
    const [search, setSearch] = useState('');
    const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchClips = async () => {
        setLoading(true);
        const res = await fetch('/api/clips');
        const data = await res.json();
        setClips(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchClips();
    }, []);

    const filteredClips = clips.filter((clip) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            clip.title.toLowerCase().includes(searchLower) ||
            clip.tags.toLowerCase().includes(searchLower)
        );
    });

    const handleToggleSelect = (clipId: string) => {
        const newSelected = new Set(selectedClips);
        if (newSelected.has(clipId)) {
            newSelected.delete(clipId);
        } else {
            newSelected.add(clipId);
        }
        setSelectedClips(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedClips.size === filteredClips.length) {
            setSelectedClips(new Set());
        } else {
            setSelectedClips(new Set(filteredClips.map((c) => c.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedClips.size === 0) return;
        if (!window.confirm(`Delete ${selectedClips.size} clips?`)) return;

        try {
            const res = await fetch('/api/admin/clips/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clipIds: Array.from(selectedClips) }),
            });

            if (!res.ok) throw new Error('Failed to delete clips');

            toast({
                title: 'Clips Deleted',
                description: `${selectedClips.size} clips removed successfully.`,
            });

            setSelectedClips(new Set());
            fetchClips();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete clips.',
            });
        }
    };

    const handleToggleFeature = async (clipId: string, currentFeatured: number) => {
        try {
            const newFeatured = currentFeatured ? 0 : 1;
            const res = await fetch(`/api/admin/clips/${clipId}/feature`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ featured: newFeatured }),
            });

            if (!res.ok) throw new Error('Failed to feature clip');

            toast({
                title: newFeatured ? 'Clip Featured' : 'Clip Unfeatured',
            });

            fetchClips();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update featured status.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clip Management</h1>
                <p className="text-muted-foreground">Manage, feature, and moderate clips</p>
            </div>

            {/* Search & Actions */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by title or tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {selectedClips.size > 0 && (
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete {selectedClips.size} clips
                    </Button>
                )}
            </div>

            {/* Clip List */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Clips ({filteredClips.length})</CardTitle>
                        <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                            {selectedClips.size === filteredClips.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {filteredClips.map((clip) => {
                            const tags = clip.tags.split(',').filter(Boolean);
                            return (
                                <div
                                    key={clip.id}
                                    className="flex gap-4 rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <Checkbox
                                        checked={selectedClips.has(clip.id)}
                                        onCheckedChange={() => handleToggleSelect(clip.id)}
                                    />

                                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded">
                                        <Image
                                            src={clip.thumbnailUrl}
                                            alt={clip.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium">{clip.title}</p>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {tags.map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            {tag.trim()}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {new Date(clip.uploadDate * 1000).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <Button
                                                variant={clip.featured ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleToggleFeature(clip.id, clip.featured)}
                                            >
                                                {clip.featured ? (
                                                    <Star className="h-4 w-4 fill-current" />
                                                ) : (
                                                    <StarOff className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredClips.length === 0 && !loading && (
                            <p className="col-span-2 text-center text-muted-foreground">No clips found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
