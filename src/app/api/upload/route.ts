import { NextRequest, NextResponse } from 'next/server';
import { fileToBuffer } from '@/lib/storage';
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
        // Convert video to buffer
        const videoBuffer = await fileToBuffer(file);

        // Handle thumbnail
        const thumbnailFile = formData.get('thumbnail') as File;
        let thumbnailBuffer: Buffer | null = null;
        let thumbnailUrl = "/placeholder.jpg";

        if (thumbnailFile && thumbnailFile.size > 0) {
            thumbnailBuffer = await fileToBuffer(thumbnailFile);
            thumbnailUrl = ""; // Clear URL as we'll use binary data
        }

        const clipId = randomBytes(16).toString('hex');

        // Insert into database using Prisma
        await prisma.clip.create({
            data: {
                id: clipId,
                title: title || file.name,
                thumbnailUrl,
                thumbnailData: thumbnailBuffer,
                fileUrl: "", // Clear URL
                fileData: videoBuffer,
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
