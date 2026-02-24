import { NextRequest, NextResponse } from 'next/server';
import { fileToBuffer } from '@/lib/storage';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';

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

        // Update database using Prisma
        interface UpdateData {
            name?: string;
            displayName?: string;
            bio?: string;
            profilePicture?: string;
            profilePictureData?: Buffer;
            bannerImage?: string;
            bannerImageData?: Buffer;
        }
        const updateData: UpdateData = {};
        if (name) updateData.name = name;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;

        // Handle profile picture
        if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
            const buffer = await fileToBuffer(profilePictureFile);
            updateData.profilePictureData = buffer;
            // Clear any old URL if we're now using DB storage
            updateData.profilePicture = "";
        }

        // Handle banner image
        if (bannerImageFile && bannerImageFile instanceof File && bannerImageFile.size > 0) {
            const buffer = await fileToBuffer(bannerImageFile);
            updateData.bannerImageData = buffer;
            // Clear any old URL
            updateData.bannerImage = "";
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
