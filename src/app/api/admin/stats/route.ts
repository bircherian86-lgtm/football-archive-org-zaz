import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';

export async function GET() {
    try {
        const session = await auth();

        if (!session || (session.user as SessionUser)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get total users
        const totalUsers = await prisma.user.count();

        // Get total clips
        const totalClips = await prisma.clip.count();

        // Get total storage
        const storageSum = await prisma.clip.aggregate({
            _sum: {
                fileSize: true
            }
        });
        const totalStorage = storageSum._sum.fileSize || 0;

        // Get recent clips (last 10)
        const recentClips = await prisma.clip.findMany({
            include: {
                user: {
                    select: { email: true }
                }
            },
            orderBy: { uploadDate: 'desc' },
            take: 10
        });

        // Get recent users (last 10)
        const recentUsers = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Get stats this week
        const oneWeekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
        const weeklySignups = await prisma.user.count({
            where: { createdAt: { gt: oneWeekAgo } }
        });
        const weeklyUploads = await prisma.clip.count({
            where: { uploadDate: { gt: oneWeekAgo } }
        });

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers,
                totalClips: totalClips,
                totalStorage: totalStorage,
                weeklySignups: weeklySignups,
                weeklyUploads: weeklyUploads,

            },
            recentClips,
            recentUsers,
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
