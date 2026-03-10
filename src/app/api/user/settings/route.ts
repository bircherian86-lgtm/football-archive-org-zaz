import { NextRequest, NextResponse } from 'next/server';
import { fileToBuffer } from '@/lib/storage';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const PFP_BANNER_DIR = process.env.PFP_BANNER_DIR || path.join(process.cwd(), 'public', 'uploads');

export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const formData = await req.formData();
        const name = formData.get('name') as string;
        const displayName = formData.get('displayName') as string;
        const bio = formData.get('bio') as string;
        const profilePictureFile = formData.get('profilePicture') as File | null;
        const bannerImageFile = formData.get('bannerImage') as File | null;

        const userId = (session.user as SessionUser)?.id;

        if (!userId) {
            return new NextResponse('User ID not found', { status: 400 });
        }

        // Ensure directory exists
        await mkdir(PFP_BANNER_DIR, { recursive: true });

        // Update database using Prisma
        interface UpdateData {
            name?: string;
            displayName?: string;
            bio?: string;
            profilePicture?: string;
            profilePictureData?: Buffer | null;
            bannerImage?: string;
            bannerImageData?: Buffer | null;
        }
        const updateData: UpdateData = {};
        if (name) updateData.name = name;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;

        // Handle profile picture
        if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
            const ext = profilePictureFile.name.split('.').pop() || 'png';
            const filename = `pfp_${userId}_${Date.now()}.${ext}`;
            const buffer = await fileToBuffer(profilePictureFile);
            const filePath = path.join(PFP_BANNER_DIR, filename);

            await writeFile(filePath, buffer);

            updateData.profilePicture = `/api/user/image?type=pfp&userId=${userId}&t=${Date.now()}`;
            // Clear binary data from DB to shrink cookie size if it's currently there
            updateData.profilePictureData = null;
        }

        // Handle banner image
        if (bannerImageFile && bannerImageFile instanceof File && bannerImageFile.size > 0) {
            const ext = bannerImageFile.name.split('.').pop() || 'png';
            const filename = `banner_${userId}_${Date.now()}.${ext}`;
            const buffer = await fileToBuffer(bannerImageFile);
            const filePath = path.join(PFP_BANNER_DIR, filename);

            await writeFile(filePath, buffer);

            updateData.bannerImage = `/api/user/image?type=banner&userId=${userId}&t=${Date.now()}`;
            // Clear binary data from DB
            updateData.bannerImageData = null;
        }


        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }

        return NextResponse.json({
            success: true,
            displayName: displayName,
            bio: bio
        });
    } catch (error) {

        console.error('Error updating settings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
