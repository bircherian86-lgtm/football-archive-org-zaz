import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
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

        let profilePictureUrl = null;
        let bannerImageUrl = null;

        // Handle profile picture upload using Vercel Blob
        if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
            const filename = `profile_${userId}_${Date.now()}.${profilePictureFile.name.split('.').pop()}`;

            const blob = await put(filename, profilePictureFile, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            profilePictureUrl = blob.url;
        }

        // Handle banner image upload using Vercel Blob
        if (bannerImageFile && bannerImageFile instanceof File && bannerImageFile.size > 0) {
            const filename = `banner_${userId}_${Date.now()}.${bannerImageFile.name.split('.').pop()}`;

            const blob = await put(filename, bannerImageFile, {
                access: 'public',
                token: process.env.BLOB_READ_WRITE_TOKEN,
            });

            bannerImageUrl = blob.url;
        }

        // Update database using Prisma
        interface UpdateData {
            name?: string;
            displayName?: string;
            bio?: string;
            profilePicture?: string;
            bannerImage?: string;
        }
        const updateData: UpdateData = {};
        if (name) updateData.name = name;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;
        if (profilePictureUrl) updateData.profilePicture = profilePictureUrl;
        if (bannerImageUrl) updateData.bannerImage = bannerImageUrl;

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: userId },
                data: updateData
            });
        }

        return NextResponse.json({
            success: true,
            profilePicture: profilePictureUrl,
            bannerImage: bannerImageUrl,
            displayName: displayName,
            bio: bio
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
