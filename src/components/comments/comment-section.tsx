'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Send } from 'lucide-react';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    createdAt: number;
    userId: string;
    displayName?: string;
    name?: string;
    email: string;
    profilePicture?: string;
}

interface CommentSectionProps {
    clipId: string;
}

export function CommentSection({ clipId }: CommentSectionProps) {
    const { data: session } = useSession();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    const user = session?.user;
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        fetchComments();
    }, [clipId]);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clips/${clipId}/comments`);
            const data = await res.json();
            setComments(data.comments || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/clips/${clipId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });

            if (!res.ok) throw new Error('Failed to post comment');

            const data = await res.json();
            setComments([data.comment, ...comments]);
            setNewComment('');
            toast({
                title: 'Comment posted',
                description: 'Your comment has been added.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to post comment.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            const res = await fetch(`/api/clips/${clipId}/comments/${commentId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete comment');

            setComments(comments.filter((c) => c.id !== commentId));
            toast({
                title: 'Comment deleted',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to delete comment.',
            });
        }
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Comments ({comments.length})</h2>

            {/* Comment Form */}
            {session ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-4">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.profilePicture || ''} alt={user?.displayName || user?.name || 'User'} />
                            <AvatarFallback className="bg-neutral-800">
                                {(user?.displayName || user?.name || user?.email)?.charAt(0) || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="resize-none border-neutral-700 bg-neutral-800"
                                rows={3}
                            />
                            <Button type="submit" disabled={submitting || !newComment.trim()} className="gap-2">
                                <Send className="h-4 w-4" />
                                {submitting ? 'Posting...' : 'Post Comment'}
                            </Button>
                        </div>
                    </div>
                </form>
            ) : (
                <p className="text-muted-foreground">
                    <Link href="/login" className="text-primary hover:underline">
                        Log in
                    </Link>
                    {' '}to leave a comment
                </p>
            )}

            {/* Comments List */}
            <div className="space-y-4">
                {loading ? (
                    <p className="text-muted-foreground">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-muted-foreground">No comments yet. Be the first!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4">
                            <Link href={`/profile/${comment.userId}`}>
                                <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80">
                                    <AvatarImage src={comment.profilePicture || ''} alt={comment.displayName || comment.name || 'User'} />
                                    <AvatarFallback className="bg-neutral-800">
                                        {(comment.displayName || comment.name || comment.email)?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            </Link>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/${comment.userId}`} className="font-semibold hover:underline">
                                            {comment.displayName || comment.name || comment.email}
                                        </Link>
                                        <span className="text-sm text-muted-foreground">{formatDate(comment.createdAt)}</span>
                                    </div>
                                    {(user?.id === comment.userId || isAdmin) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(comment.id)}
                                            className="text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
