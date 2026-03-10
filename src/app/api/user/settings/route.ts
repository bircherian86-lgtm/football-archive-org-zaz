import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
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

        // Get current user to check for old blob URLs
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePicture: true, bannerImage: true }
        });

        interface UpdateData {
            name?: string;
            displayName?: string;
            bio?: string;
            profilePicture?: string;
            profilePictureData?: null;
            bannerImage?: string;
            bannerImageData?: null;
        }
        const updateData: UpdateData = {};
        if (name) updateData.name = name;
        if (displayName !== undefined) updateData.displayName = displayName;
        if (bio !== undefined) updateData.bio = bio;

        const responseData: Record<string, string> = {};

        // 1. Handle Profile Picture
        if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
            // Delete old blob if exists
            if (user?.profilePicture?.includes('public.blob.vercel-storage.com')) {
                await del(user.profilePicture).catch(e => console.warn("Failed to delete old pfp blob:", e));
            }

            const pfpBlob = await put(`avatars/${userId}_${Date.now()}.png`, profilePictureFile, {
                access: 'public',
            });
            updateData.profilePicture = pfpBlob.url;
            updateData.profilePictureData = null;
            responseData.profilePicture = pfpBlob.url;
        }

        // 2. Handle Banner Image
        if (bannerImageFile && bannerImageFile instanceof File && bannerImageFile.size > 0) {
            // Delete old blob if exists
            if (user?.bannerImage?.includes('public.blob.vercel-storage.com')) {
                await del(user.bannerImage).catch(e => console.warn("Failed to delete old banner blob:", e));
            }

            const bannerBlob = await put(`banners/${userId}_${Date.now()}.png`, bannerImageFile, {
                access: 'public',
            });
            updateData.bannerImage = bannerBlob.url;
            updateData.bannerImageData = null;
            responseData.bannerImage = bannerBlob.url;
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
            bio: bio,
            ...responseData
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
