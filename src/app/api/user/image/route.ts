import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readFile, readdir } from 'fs/promises';
import path from 'path';

const PFP_BANNER_DIR = process.env.PFP_BANNER_DIR || path.join(process.cwd(), 'public', 'uploads');

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const type = searchParams.get('type'); // 'pfp' or 'banner'

        if (!userId || !type) {
            return new NextResponse('Missing userId or type', { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                profilePicture: true,
                profilePictureData: true,
                bannerImage: true,
                bannerImageData: true
            }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        // Try local disk first based on naming convention
        try {
            const files = await readdir(PFP_BANNER_DIR);
            const prefix = type === 'pfp' ? `pfp_${userId}_` : `banner_${userId}_`;
            const userFile = files.find(f => f.startsWith(prefix));

            if (userFile) {
                const filePath = path.join(PFP_BANNER_DIR, userFile);
                const buffer = await readFile(filePath);
                const ext = userFile.split('.').pop() || 'png';

                return new NextResponse(buffer, {
                    headers: {
                        'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        'Cache-Control': 'public, max-age=3600',
                    }
                });
            }
        } catch (err) {
            console.error('Error reading from disk:', err);
        }

        // Fallback to DB storage
        const dbData = type === 'pfp' ? user.profilePictureData : user.bannerImageData;
        if (dbData) {
            return new NextResponse(new Uint8Array(dbData), {
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=3600',
                }
            });
        }

        // Final fallback to default placeholder
        return NextResponse.redirect(new URL('/placeholder.jpg', req.url));

    } catch (error) {
        console.error('Error serving user image:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
