import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { del } from "@vercel/blob";
import { bufferToDataUri } from "@/lib/storage";
import type { SessionUser } from '@/types/session';

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
                        email: true,
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
        const processedClip: any = { ...clip };
        if (processedClip.thumbnailData) {
            processedClip.thumbnailUrl = bufferToDataUri(processedClip.thumbnailData, 'image/png');
        }

        // Use the custom video endpoint if we have data in DB
        if (processedClip.fileData) {
            processedClip.fileUrl = `/api/clips/${clipId}/video`;
        }

        // Cleanup response
        delete processedClip.thumbnailData;
        delete processedClip.fileData;

        // Process uploader data
        if (processedClip.user) {
            if (processedClip.user.profilePictureData) {
                processedClip.user.profilePicture = bufferToDataUri(processedClip.user.profilePictureData, 'image/png');
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

        // Delete from Vercel Blob storage
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

        // Delete from database
        await prisma.clip.delete({
            where: { id: clipId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting clip:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
