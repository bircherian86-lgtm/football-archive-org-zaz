'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Save, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
    const { toast } = useToast();

    const handleSave = () => {
        toast({
            title: 'Settings Saved',
            description: 'Your settings have been updated.',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Configure platform settings</p>
            </div>

            <div className="grid gap-6">
                {/* Upload Settings */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle>Upload Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxSize">Max File Size (MB)</Label>
                            <Input id="maxSize" type="number" defaultValue="50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="formats">Allowed Formats</Label>
                            <Input id="formats" defaultValue="mp4, mov, avi, webm" />
                        </div>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Upload Settings
                        </Button>
                    </CardContent>
                </Card>

                {/* Site Settings */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle>Site Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="siteName">Site Name</Label>
                            <Input id="siteName" defaultValue="Football Clips Archive" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Site Description</Label>
                            <Input id="description" defaultValue="The ultimate destination for iconic football moments" />
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="maintenance" className="rounded" />
                                <Label htmlFor="maintenance">Maintenance Mode</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="registration" className="rounded" defaultChecked />
                                <Label htmlFor="registration">Allow Registration</Label>
                            </div>
                        </div>
                        <Button onClick={handleSave}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Site Settings
                        </Button>
                    </CardContent>
                </Card>

                {/* System Info */}
                <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            System Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Database:</span>
                                <span>SQLite</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Storage Location:</span>
                                <span>public/uploads</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Platform:</span>
                                <span>Next.js 15 + NextAuth</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
