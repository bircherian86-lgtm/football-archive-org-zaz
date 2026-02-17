'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, VideoIcon, HardDrive, Upload, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Clip {
    id: string;
    title: string;
    uploaderEmail?: string;
    uploadDate: number;
}

interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
}

interface AdminStats {
    stats: {
        totalUsers: number;
        totalClips: number;
        totalStorage: number;
        weeklySignups: number;
        weeklyUploads: number;
    };
    recentClips: Clip[];
    recentUsers: User[];
}

export default function AdminDashboard() {
    const [data, setData] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load stats:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (!data) {
        return <div>Failed to load dashboard</div>;
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const stats = [
        {
            title: 'Total Users',
            value: data.stats.totalUsers,
            icon: Users,
            color: 'text-blue-500',
        },
        {
            title: 'Total Clips',
            value: data.stats.totalClips,
            icon: VideoIcon,
            color: 'text-green-500',
        },
        {
            title: 'Storage Used',
            value: formatBytes(data.stats.totalStorage),
            icon: HardDrive,
            color: 'text-purple-500',
        },
        {
            title: 'Weekly Signups',
            value: data.stats.weeklySignups,
            icon: UserPlus,
            color: 'text-yellow-500',
        },
        {
            title: 'Weekly Uploads',
            value: data.stats.weeklyUploads,
            icon: Upload,
            color: 'text-pink-500',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your platform</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-white/10 bg-black/40 backdrop-blur-lg">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Recent Clips */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle>Recent Uploads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.recentClips.slice(0, 5).map((clip) => (
                                <div
                                    key={clip.id}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{clip.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            by {clip.uploaderEmail || 'Unknown'}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {new Date(clip.uploadDate * 1000).toLocaleDateString()}
                                    </Badge>
                                </div>
                            ))}
                            {data.recentClips.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No clips yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Users */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle>Recent Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.recentUsers.slice(0, 5).map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.name || 'No name'}
                                        </p>
                                    </div>
                                    <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </div>
                            ))}
                            {data.recentUsers.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No users yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
