import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clipId } = await params;

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            select: { fileData: true, fileName: true, fileUrl: true }
        });

        if (!clip) {
            return new NextResponse('Video not found', { status: 404 });
        }

        // 0. Primary: If it's a Blob URL, redirect directly
        if (clip.fileUrl && clip.fileUrl.startsWith('http')) {
            return NextResponse.redirect(clip.fileUrl);
        }

        // First try: serve from local disk (D:\SITE)
        if (clip.fileName) {
            try {
                const filePath = path.join(UPLOAD_DIR, clip.fileName);
                const fileBuffer = await readFile(filePath);
                return new NextResponse(new Uint8Array(fileBuffer), {
                    headers: {
                        'Content-Type': 'video/mp4',
                        'Content-Length': fileBuffer.length.toString(),
                        'Cache-Control': 'public, max-age=3600',
                    },
                });
            } catch {
                // File not on disk, fall through to DB
            }
        }

        // Fallback: serve from DB binary (legacy clips)
        if (clip.fileData) {
            return new NextResponse(new Uint8Array(clip.fileData), {
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Length': clip.fileData.length.toString(),
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        }

        return new NextResponse('Video not found', { status: 404 });
    } catch (error) {
        console.error('Error serving video:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
