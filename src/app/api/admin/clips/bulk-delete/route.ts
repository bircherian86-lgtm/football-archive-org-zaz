import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { clipIds } = await req.json();

        if (!Array.isArray(clipIds) || clipIds.length === 0) {
            return new NextResponse('Invalid clip IDs', { status: 400 });
        }

        // Get clip filenames for deletion
        const clips = await prisma.clip.findMany({
            where: { id: { in: clipIds } },
            select: { fileName: true, thumbnailUrl: true }
        });

        // Delete files from disk
        for (const clip of clips) {
            try {
                const filePath = path.join(process.cwd(), 'public', 'uploads', clip.fileName);
                await unlink(filePath);

                // Delete thumbnail
                if (clip.thumbnailUrl && clip.thumbnailUrl.startsWith('/uploads/')) {
                    const thumbName = clip.thumbnailUrl.replace('/uploads/', '');
                    const thumbPath = path.join(process.cwd(), 'public', 'uploads', thumbName);
                    await unlink(thumbPath).catch(() => { });
                }
            } catch (err) {
                console.warn('Could not delete file:', err);
            }
        }

        // Delete from database
        await prisma.clip.deleteMany({
            where: { id: { in: clipIds } }
        });

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId: (session.user as any).id,
                action: 'BULK_DELETE_CLIPS',
                details: `Deleted ${clipIds.length} clips: ${clipIds.join(',')}`
            }
        });

        return NextResponse.json({ success: true, count: clipIds.length });
    } catch (error) {
        console.error('Error bulk deleting clips:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
