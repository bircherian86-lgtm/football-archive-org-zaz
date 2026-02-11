import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';

// GET - Fetch all comments for a clip
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clipId } = await params;

        const comments = await prisma.comment.findMany({
            where: { clipId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        name: true,
                        email: true,
                        profilePicture: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Flatten user info for compatibility with existing frontend
        const formattedComments = comments.map(c => ({
            ...c,
            displayName: c.user.displayName,
            name: c.user.name,
            email: c.user.email,
            profilePicture: c.user.profilePicture
        }));

        return NextResponse.json({ comments: formattedComments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST - Add a new comment
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: clipId } = await params;
        const { content } = await req.json();

        if (!content || content.trim().length === 0) {
            return new NextResponse('Content is required', { status: 400 });
        }

        const userId = (session.user as any)?.id;
        const commentId = randomBytes(16).toString('hex');

        await prisma.comment.create({
            data: {
                id: commentId,
                clipId,
                userId,
                content: content.trim()
            }
        });

        // Fetch the newly created comment with user info
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        name: true,
                        email: true,
                        profilePicture: true
                    }
                }
            }
        });

        const formattedComment = comment ? {
            ...comment,
            displayName: comment.user.displayName,
            name: comment.user.name,
            email: comment.user.email,
            profilePicture: comment.user.profilePicture
        } : null;

        return NextResponse.json({ comment: formattedComment });
    } catch (error) {
        console.error('Error creating comment:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
