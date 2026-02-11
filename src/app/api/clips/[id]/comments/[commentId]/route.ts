import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// DELETE - Delete a comment
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { commentId } = await params;
        const userId = (session.user as any)?.id;
        const isAdmin = (session.user as any)?.role === 'ADMIN';

        // Get comment to check ownership
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: { userId: true }
        });

        if (!comment) {
            return new NextResponse('Comment not found', { status: 404 });
        }

        // Only owner or admin can delete
        if (comment.userId !== userId && !isAdmin) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting comment:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
