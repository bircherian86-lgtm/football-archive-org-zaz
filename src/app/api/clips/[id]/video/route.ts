import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clipId } = await params;

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            select: { fileData: true }
        });

        if (!clip || !clip.fileData) {
            return new NextResponse('Video not found', { status: 404 });
        }

        // Return the video as a stream with appropriate headers
        // Simple MPEG-4 assumption, you can store mimeType in DB if needed
        return new NextResponse(clip.fileData, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': clip.fileData.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        console.error('Error serving video:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
