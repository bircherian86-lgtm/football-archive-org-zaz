import { NextRequest, NextResponse } from 'next/server';
import { fileToBuffer } from '@/lib/storage';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { randomBytes } from 'crypto';
import type { SessionUser } from '@/types/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

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

    if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
            { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
            { status: 413 }
        );
    }

    const clipId = randomBytes(16).toString('hex');
    const filename = clipId + "_" + file.name.replaceAll(" ", "_");

    try {
        // Ensure upload directory exists
        await mkdir(UPLOAD_DIR, { recursive: true });

        // Save video file to disk (D:\SITE or configured directory)
        const videoBytes = await file.arrayBuffer();
        const videoBuffer = Buffer.from(videoBytes);
        const videoPath = path.join(UPLOAD_DIR, filename);
        await writeFile(videoPath, videoBuffer);

        // Handle thumbnail — small enough for DB storage
        const thumbnailFile = formData.get('thumbnail') as File;
        let thumbnailBuffer: Buffer | null = null;
        let thumbnailUrl = "/placeholder.jpg";

        if (thumbnailFile && thumbnailFile.size > 0) {
            thumbnailBuffer = await fileToBuffer(thumbnailFile);
            thumbnailUrl = "";
        }

        // Insert metadata into database (video stays on disk)
        await prisma.clip.create({
            data: {
                id: clipId,
                title: title || file.name,
                thumbnailUrl,
                thumbnailData: thumbnailBuffer,
                fileUrl: "",       // Video served via /api/clips/[id]/video
                fileData: null,    // Not storing binary in DB
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
        console.error("Error occurred ", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
