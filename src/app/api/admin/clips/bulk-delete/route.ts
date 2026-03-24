import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { unlink } from 'fs/promises';
import path from 'path';
import type { SessionUser } from '@/types/session';

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || (session.user as SessionUser)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { clipIds } = await req.json();
        const adminId = (session.user as SessionUser)?.id;

        if (!adminId) {
            return new NextResponse('Admin ID not found', { status: 400 });
        }

        if (!Array.isArray(clipIds) || clipIds.length === 0) {
            return new NextResponse('Invalid clip IDs', { status: 400 });
        }

        const extractSupabasePath = (url: string, bucket: string) => {
            const marker = `/storage/v1/object/public/${bucket}/`;
            const idx = url.indexOf(marker);
            return idx !== -1 ? url.slice(idx + marker.length) : null;
        };

        // Get clip info for deletion
        const clips = await prisma.clip.findMany({
            where: { id: { in: clipIds } },
            select: { fileName: true, fileUrl: true, thumbnailUrl: true }
        });

        // Delete files from disk and Supabase Storage
        for (const clip of clips) {
            // Delete from local disk (fallback)
            try {
                const filePath = path.join(process.cwd(), 'public', 'uploads', clip.fileName);
                await unlink(filePath);

                if (clip.thumbnailUrl && clip.thumbnailUrl.startsWith('/uploads/')) {
                    const thumbName = clip.thumbnailUrl.replace('/uploads/', '');
                    const thumbPath = path.join(process.cwd(), 'public', 'uploads', thumbName);
                    await unlink(thumbPath).catch(() => { });
                }
            } catch (err) {
                console.warn('Could not delete file from disk:', err);
            }

            // Delete from Supabase Storage
            try {
                if (clip.fileUrl && clip.fileUrl.includes('supabase.co')) {
                    const videoPath = extractSupabasePath(clip.fileUrl, 'videos');
                    if (videoPath) {
                        await supabase.storage.from('videos').remove([videoPath]);
                    }
                }
                if (clip.thumbnailUrl && clip.thumbnailUrl.includes('supabase.co')) {
                    const thumbPath = extractSupabasePath(clip.thumbnailUrl, 'thumbnails');
                    if (thumbPath) {
                        await supabase.storage.from('thumbnails').remove([thumbPath]);
                    }
                }
            } catch (err) {
                console.warn('Could not delete from Supabase Storage:', err);
            }
        }

        // Delete from database
        await prisma.clip.deleteMany({
            where: { id: { in: clipIds } }
        });

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId,
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
