import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { bufferToDataUri } from '@/lib/storage';

// GET - Fetch user profile and their clips
export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;

        // Check for hardcoded admin
        let user: any;
        if (userId === 'admin') {
            user = await prisma.user.findUnique({
                where: { id: 'admin' }
            });

            if (!user) {
                user = {
                    id: 'admin',
                    email: 'admin@example.com',
                    name: 'Administrator',
                    displayName: 'Site Admin',
                    role: 'ADMIN',
                    createdAt: new Date(),
                };
            }
        } else {
            user = await prisma.user.findUnique({
                where: { id: userId }
            });
        }

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Convert binary images to Data URIs (simple detection for common types)
        if (user.profilePictureData) {
            user.profilePicture = bufferToDataUri(user.profilePictureData, 'image/png');
            delete user.profilePictureData;
        }
        if (user.bannerImageData) {
            user.bannerImage = bufferToDataUri(user.bannerImageData, 'image/png');
            delete user.bannerImageData;
        }

        // Get user's clips
        const clips = await prisma.clip.findMany({
            where: { userId },
            orderBy: { uploadDate: 'desc' }
        });

        const clipsWithDataUris = clips.map((clip: any) => {
            const clipData = { ...clip };
            if (clipData.thumbnailData) {
                clipData.thumbnailUrl = bufferToDataUri(clipData.thumbnailData, 'image/png');
                delete clipData.thumbnailData;
            }
            // Note: We don't convert the full video to data URI here as it would be too large for a JSON response
            // Usually, you'd serve the video from a separate GET route that streams the Buffer.
            delete clipData.fileData;
            return clipData;
        });

        // Get upload count
        const stats = {
            totalUploads: clips.length,
            joinDate: user.createdAt,
        };

        return NextResponse.json({
            user,
            clips: clipsWithDataUris,
            stats,
        });

    } catch (error) {
        console.error('Error fetching user profile:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
