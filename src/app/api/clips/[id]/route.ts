import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unlink } from "fs/promises";
import path from "path";

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
                        profilePicture: true
                    }
                }
            }
        });

        if (!clip) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json({
            clip: {
                ...clip,
                uploader: clip.user ? {
                    id: clip.user.id,
                    email: clip.user.email,
                    displayName: clip.user.displayName,
                    name: clip.user.name,
                    profilePicture: clip.user.profilePicture
                } : null
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
        const userRole = (session.user as any)?.role;
        const userId = (session.user as any)?.id;

        const isAdmin = userRole === "ADMIN";
        const isOwner = clip.userId === userId;

        if (!isAdmin && !isOwner) {
            return new NextResponse("Forbidden: You can only delete your own clips", { status: 403 });
        }

        // Delete file from disk
        try {
            const filePath = path.join(process.cwd(), "public", "uploads", clip.fileName);
            await unlink(filePath);

            // Try to delete thumbnail if it exists
            if (clip.thumbnailUrl && clip.thumbnailUrl.startsWith('/uploads/')) {
                const thumbName = clip.thumbnailUrl.replace('/uploads/', '');
                const thumbPath = path.join(process.cwd(), "public", "uploads", thumbName);
                await unlink(thumbPath).catch(() => {
                    // Ignore if thumbnail doesn't exist
                });
            }
        } catch (err) {
            console.warn("Could not delete file:", err);
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
