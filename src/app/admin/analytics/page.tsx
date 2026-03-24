'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Tags, HardDrive, Activity } from 'lucide-react';

interface AnalyticsData {
    uploadsByDay: Array<{ date: string; count: number }>;
    topUploaders: Array<{ email: string; name: string; clipCount: number }>;
    popularTags: Array<{ tag: string; count: number }>;
    storageByUser: Array<{ email: string; totalSize: number }>;
    recentActions: Array<{ action: string; adminEmail: string; details: string; timestamp: number }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then((res) => res.json())
            .then((data) => {
                setData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load analytics:', err);
                setLoading(false);
            });
    }, []);

    if (loading || !data) {
        return <div>Loading...</div>;
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics & Logs</h1>
                <p className="text-muted-foreground">Platform insights and activity</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Top Uploaders */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Top Uploaders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.topUploaders.map((user, index) => (
                                <div
                                    key={user.email}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <div>
                                        <p className="font-medium">{user.email}</p>
                                        <p className="text-xs text-muted-foreground">{user.name || 'No name'}</p>
                                    </div>
                                    <Badge>{user.clipCount} clips</Badge>
                                </div>
                            ))}
                            {data.topUploaders.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Popular Tags */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-primary" />
                            Popular Tags
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {data.popularTags.map((tag) => (
                                <Badge key={tag.tag} variant="secondary" className="text-sm">
                                    {tag.tag} ({tag.count})
                                </Badge>
                            ))}
                            {data.popularTags.length === 0 && (
                                <p className="text-sm text-muted-foreground">No tags</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Storage by User */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-primary" />
                            Storage by User
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.storageByUser.map((user) => (
                                <div
                                    key={user.email}
                                    className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <p className="font-medium">{user.email}</p>
                                    <Badge>{formatBytes(user.totalSize)}</Badge>
                                </div>
                            ))}
                            {data.storageByUser.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Admin Actions */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Recent Admin Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.recentActions.slice(0, 10).map((action, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-white/10 bg-black/20 p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{action.action}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(action.timestamp * 1000).toLocaleString()}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        by {action.adminEmail} • {action.details}
                                    </p>
                                </div>
                            ))}
                            {data.recentActions.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground">No actions yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
