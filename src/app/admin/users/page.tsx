'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, Trash2, Ban, Shield, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    banned: number;
    createdAt: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchUsers = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (roleFilter) params.set('role', roleFilter);

        const res = await fetch(`/api/admin/users?${params}`);
        const data = await res.json();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter]);

    const handleBan = async (userId: string, currentBanned: number) => {
        try {
            const newBanned = currentBanned ? 0 : 1;
            const res = await fetch(`/api/admin/users/${userId}/ban`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ banned: newBanned }),
            });

            if (!res.ok) throw new Error('Failed to update ban status');

            toast({
                title: newBanned ? 'User Banned' : 'User Unbanned',
                description: `User has been ${newBanned ? 'banned' : 'unbanned'} successfully.`,
            });

            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update ban status.',
            });
        }
    };

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) throw new Error('Failed to change role');

            toast({
                title: 'Role Changed',
                description: `User role updated to ${newRole}.`,
            });

            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to change role.',
            });
        }
    };

    const handleDelete = async (userId: string, email: string) => {
        if (!window.confirm(`Delete user ${email}? This will also delete all their clips.`)) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            if (!res.ok) throw new Error('Failed to delete user');

            toast({
                title: 'User Deleted',
                description: 'User and all their clips have been removed.',
            });

            fetchUsers();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete user.',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Manage users, roles, and permissions</p>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">All Roles</SelectItem>
                        <SelectItem value="USER">User</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* User List */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-lg">
                <CardHeader>
                    <CardTitle>All Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/20 p-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{user.email}</p>
                                        {user.banned === 1 && (
                                            <Badge variant="destructive" className="text-xs">
                                                BANNED
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {user.name || 'No name'} • Joined {new Date(user.createdAt * 1000).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Select
                                        value={user.role}
                                        onValueChange={(role) => handleChangeRole(user.id, role)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USER">User</SelectItem>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Button
                                        variant={user.banned ? 'outline' : 'destructive'}
                                        size="sm"
                                        onClick={() => handleBan(user.id, user.banned)}
                                    >
                                        <Ban className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(user.id, user.email)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {users.length === 0 && !loading && (
                            <p className="text-center text-muted-foreground">No users found</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
