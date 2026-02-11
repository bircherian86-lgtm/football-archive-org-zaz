import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Fetch user profile and their clips
export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // Check for hardcoded admin
        let user;
        if (userId === 'admin') {
            user = {
                id: 'admin',
                email: 'admin@example.com',
                name: 'Administrator',
                displayName: 'Site Admin',
                role: 'ADMIN',
                createdAt: new Date(), // Prisma DateTime
            };
        } else {
            user = await prisma.user.findUnique({
                where: { id: userId }
            });
        }

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Get user's clips
        const clips = await prisma.clip.findMany({
            where: { userId },
            orderBy: { uploadDate: 'desc' }
        });

        // Get upload count
        const stats = {
            totalUploads: clips.length,
            joinDate: user.createdAt,
        };

        return NextResponse.json({
            user,
            clips,
            stats,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
