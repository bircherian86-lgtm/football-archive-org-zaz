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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let user: any;
        if (userId === 'admin') {
            user = await prisma.user.findUnique({
                where: { id: 'admin' },
                select: {
                    id: true,
                    displayName: true,
                    name: true,
                    profilePicture: true,
                    profilePictureData: true,
                    bannerImage: true,
                    bannerImageData: true,
                    role: true,
                    createdAt: true,
                }
            });

            if (!user) {
                user = {
                    id: 'admin',
                    email: 'admin@example.com', // This email is still hardcoded for the default admin object
                    name: 'Administrator',
                    displayName: 'Site Admin',
                    role: 'ADMIN',
                    createdAt: new Date(),
                };
            }
        } else {
            user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    displayName: true,
                    name: true,
                    profilePicture: true,
                    profilePictureData: true,
                    bannerImage: true,
                    bannerImageData: true,
                    role: true,
                    createdAt: true,
                }
            });
        }

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Use the image API endpoint for profile and banner
        if (user.profilePictureData || user.profilePicture?.startsWith('data:')) {
            user.profilePicture = `/api/user/image?type=pfp&userId=${userId}`;
        }
        if (user.bannerImageData || user.bannerImage?.startsWith('data:')) {
            user.bannerImage = `/api/user/image?type=banner&userId=${userId}`;
        }
        delete user.profilePictureData;
        delete user.bannerImageData;
        delete user.email; // Privacy: hide email on public profile
        delete user.password; // Security: always remove password from JSON response

        // Get user's clips
        const clips = await prisma.clip.findMany({
            where: { userId },
            orderBy: { uploadDate: 'desc' }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
