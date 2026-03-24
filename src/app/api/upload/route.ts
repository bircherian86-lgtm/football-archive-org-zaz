import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/supabase';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const thumbnailFile = formData.get('thumbnail') as File;
        const title = formData.get('title') as string;
        const tags = formData.get('tags') as string;

        if (!file) {
            return NextResponse.json({ error: "No video file received." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` },
                { status: 413 }
            );
        }

        // 1. Upload video to Supabase Storage
        const videoUrl = await uploadFile('videos', `${Date.now()}_${file.name.replaceAll(" ", "_")}`, file);

        // 2. Upload thumbnail to Supabase Storage if provided
        let thumbnailUrl = "/placeholder.jpg";
        if (thumbnailFile && thumbnailFile.size > 0) {
            thumbnailUrl = await uploadFile('thumbnails', `${Date.now()}_thumb_${thumbnailFile.name.replaceAll(" ", "_")}`, thumbnailFile);
        }

        // 3. Save to database
        const clip = await prisma.clip.create({
            data: {
                title: title || file.name,
                thumbnailUrl: thumbnailUrl,
                thumbnailData: null, // Clear binary data
                fileUrl: videoUrl,
                fileData: null,     // Clear binary data
                fileName: file.name,
                fileSize: file.size,
                tags: tags || "",
                userId: (session.user as SessionUser)?.id || null,
                uploadDate: new Date(),
                featured: false
            }
        });

        return NextResponse.json({ success: true, clipId: clip.id });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
