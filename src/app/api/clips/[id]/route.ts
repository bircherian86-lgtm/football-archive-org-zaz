import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";
import { bufferToDataUri } from "@/lib/storage";
import type { SessionUser } from '@/types/session';
import { unlink } from 'fs/promises';
import path from 'path';

// GET - Fetch a single clip with uploader info
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clipId } = await params;

        const clip = await prisma.clip.findUnique({
            where: { id: clipId },
            include: {
                user: {
                    select: {
                        id: true,
                        displayName: true,
                        name: true,
                        profilePicture: true,
                        profilePictureData: true
                    }
                }
            }
        });

        if (!clip) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Convert clip binary to Data URI
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedClip: any = { ...clip };
        if (processedClip.thumbnailData) {
            processedClip.thumbnailUrl = bufferToDataUri(processedClip.thumbnailData, 'image/png');
        }

        // Use direct Blob URL if it exists, otherwise use streaming proxy
        if (!processedClip.fileUrl || !processedClip.fileUrl.startsWith('http')) {
            processedClip.fileUrl = `/api/clips/${clipId}/video`;
        }

        // Cleanup response
        delete processedClip.thumbnailData;
        delete processedClip.fileData;

        // Process uploader data
        if (processedClip.user) {
            const uploaderId = processedClip.user.id;
            // Only use the proxy if it's not already a external URL
            if (!processedClip.user.profilePicture || !processedClip.user.profilePicture.startsWith('http')) {
                if (processedClip.user.profilePictureData || processedClip.user.profilePicture?.startsWith('data:')) {
                    processedClip.user.profilePicture = `/api/user/image?type=pfp&userId=${uploaderId}&t=${Date.now()}`;
                }
            }
            delete processedClip.user.profilePictureData;
        }

        return NextResponse.json({
            clip: {
                ...processedClip,
                uploader: processedClip.user ? processedClip.user : null
            }
        });

    } catch (error) {
        console.error("Error fetching clip:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id: clipId } = await params;

        // Get clip info
        const clip = await prisma.clip.findUnique({
            where: { id: clipId }
        });

        if (!clip) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Check permissions: Admin can delete any clip, users can only delete their own
        const userRole = (session.user as SessionUser)?.role;
        const userId = (session.user as SessionUser)?.id;

        const isAdmin = userRole === "ADMIN";
        const isOwner = clip.userId === userId;

        if (!isAdmin && !isOwner) {
            return new NextResponse("Forbidden: You can only delete your own clips", { status: 403 });
        }

        // 1. Delete video file from disk (D:\SITE fallback)
        if (clip.fileName) {
            try {
                const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');
                const filePath = path.join(UPLOAD_DIR, clip.fileName);
                await unlink(filePath).catch(() => { });
            } catch (err) {
                // Silently ignore if file doesn't exist
            }
        }

        // 2. Delete from Vercel Blob storage (Primary)
        try {
            if (clip.fileUrl && clip.fileUrl.includes('vercel-storage.com')) {
                await del(clip.fileUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }

            if (clip.thumbnailUrl && clip.thumbnailUrl.includes('vercel-storage.com')) {
                await del(clip.thumbnailUrl, { token: process.env.BLOB_READ_WRITE_TOKEN });
            }
        } catch (err) {
            console.warn("Could not delete from Vercel Blob:", err);
        }

        // 3. Delete from database
        await prisma.clip.delete({
            where: { id: clipId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting clip:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
