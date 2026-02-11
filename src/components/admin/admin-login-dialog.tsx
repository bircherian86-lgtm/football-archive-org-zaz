'use client';

import { useState } from 'react';
import { useAdmin } from '@/context/admin-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Lock, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AdminLoginDialog() {
    const { isAdmin, login, logout } = useAdmin();
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { toast } = useToast();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'zazaep21' && password === 'bedwars2133') {
            login();
            setIsOpen(false);
            setUsername('');
            setPassword('');
            toast({
                title: 'Admin Access Granted',
                description: 'You are now logged in as an administrator.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Access Denied',
                description: 'Invalid credentials.',
            });
        }
    };

    const handleLogout = () => {
        logout();
        toast({
            title: 'Logged Out',
            description: 'You have exited admin mode.',
        });
    };

    if (isAdmin) {
        return (
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                <LogOut className="mr-2 h-4 w-4" />
                Exit Admin
            </Button>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Lock className="mr-2 h-4 w-4" />
                    Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-white/10 bg-neutral-900/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Admin Access</DialogTitle>
                    <DialogDescription>
                        Enter your credentials to access administrative functions.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleLogin} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">
                            Username
                        </Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="col-span-3 bg-black/20"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="col-span-3 bg-black/20"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Login</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
