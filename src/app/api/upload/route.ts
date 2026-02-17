import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';
import type { SessionUser } from '@/types/session';

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const tags = formData.get('tags') as string;

    if (!file) {
        return NextResponse.json({ error: "No files received." }, { status: 400 });
    }

    const filename = Date.now() + "_" + file.name.replaceAll(" ", "_");

    try {
        // Upload video file to Vercel Blob
        const videoBlob = await put(filename, file, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        // Handle thumbnail
        const thumbnailFile = formData.get('thumbnail') as File;
        let thumbnailUrl = "/placeholder.jpg";

        if (thumbnailFile) {
            const thumbName = "thumb_" + Date.now() + "_" + thumbnailFile.name.replaceAll(" ", "_");
            const thumbnailBlob = await put(thumbName, thumbnailFile, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });
            thumbnailUrl = thumbnailBlob.url;
        }

        const videoUrl = videoBlob.url;
        const clipId = randomBytes(16).toString('hex');

        // Insert into database using Prisma
        await prisma.clip.create({
            data: {
                id: clipId,
                title: title || file.name,
                thumbnailUrl,
                fileUrl: videoUrl,
                fileName: filename,
                fileSize: file.size,
                tags: tags || "",
                userId: (session.user as SessionUser)?.id || null,
                uploadDate: new Date(),
                featured: false
            }
        });

        return NextResponse.json({ success: true, clipId });
    } catch (error) {
        console.log("Error occurred ", error);
        return NextResponse.json({ Message: "Failed", status: 500 });
    }
}
