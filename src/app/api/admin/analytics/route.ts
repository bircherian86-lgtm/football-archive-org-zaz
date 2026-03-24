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

        // Get upload stats by day (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
        const recentClips = await prisma.clip.findMany({
            where: { uploadDate: { gt: thirtyDaysAgo } },
            select: { uploadDate: true }
        });

        // Group by day in-memory for cross-db compatibility
        const dayCounts: Record<string, number> = {};
        recentClips.forEach(c => {
            const date = c.uploadDate.toISOString().split('T')[0];
            dayCounts[date] = (dayCounts[date] || 0) + 1;
        });
        const uploadsByDay = Object.entries(dayCounts).map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date));

        // Top uploaders
        const uploaders = await prisma.user.findMany({
            include: {
                _count: {
                    select: { clips: true }
                }
            },
            take: 10
        });
        const topUploaders = uploaders.map(u => ({
            email: u.email,
            name: u.name,
            clipCount: u._count.clips
        })).sort((a, b) => b.clipCount - a.clipCount);

        // Popular tags
        const allClips = await prisma.clip.findMany({
            select: { tags: true }
        });
        const tagCounts: Record<string, number> = {};
        allClips.forEach((clip) => {
            const tags = clip.tags.split(',');
            tags.forEach((tag) => {
                const trimmed = tag.trim();
                if (trimmed) {
                    tagCounts[trimmed] = (tagCounts[trimmed] || 0) + 1;
                }
            });
        });
        const popularTags = Object.entries(tagCounts)
            .map(([tag, count]) => ({ tag, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Storage by user
        const usersWithClips = await prisma.user.findMany({
            include: {
                clips: {
                    select: { fileSize: true }
                }
            },
            take: 10
        });
        const storageByUser = usersWithClips.map((u) => ({
            email: u.email,
            totalSize: u.clips.reduce((sum: number, c) => sum + (c.fileSize || 0), 0)
        })).sort((a, b) => b.totalSize - a.totalSize);

        // Recent admin actions
        const recentActions = await prisma.adminLog.findMany({
            include: {
                admin: {
                    select: { email: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 20
        });

        // Flatten adminEmail for compatibility
        const formattedActions = recentActions.map((a) => ({
            ...a,
            adminEmail: a.admin?.email || 'System'
        }));

        return NextResponse.json({
            uploadsByDay,
            topUploaders,
            popularTags,
            storageByUser,
            recentActions: formattedActions,

        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
