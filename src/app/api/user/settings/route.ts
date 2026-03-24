import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, supabase } from '@/lib/supabase';
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

        // Get current user to check for old storage paths
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

        // Helper: extract Supabase storage path from a public URL
        const extractSupabasePath = (url: string, bucket: string) => {
            const marker = `/storage/v1/object/public/${bucket}/`;
            const idx = url.indexOf(marker);
            return idx !== -1 ? url.slice(idx + marker.length) : null;
        };

        // 1. Handle Profile Picture
        if (profilePictureFile && profilePictureFile instanceof File && profilePictureFile.size > 0) {
            // Delete old file from Supabase if exists
            if (user?.profilePicture) {
                const oldPath = extractSupabasePath(user.profilePicture, 'avatars');
                if (oldPath) {
                    await supabase.storage.from('avatars').remove([oldPath]).catch(e =>
                        console.warn("Failed to delete old avatar from Supabase:", e)
                    );
                }
            }

            const pfpUrl = await uploadFile('avatars', `${userId}_${Date.now()}.png`, profilePictureFile);
            updateData.profilePicture = pfpUrl;
            updateData.profilePictureData = null;
            responseData.profilePicture = pfpUrl;
        }

        // 2. Handle Banner Image
        if (bannerImageFile && bannerImageFile instanceof File && bannerImageFile.size > 0) {
            // Delete old file from Supabase if exists
            if (user?.bannerImage) {
                const oldPath = extractSupabasePath(user.bannerImage, 'banners');
                if (oldPath) {
                    await supabase.storage.from('banners').remove([oldPath]).catch(e =>
                        console.warn("Failed to delete old banner from Supabase:", e)
                    );
                }
            }

            const bannerUrl = await uploadFile('banners', `${userId}_${Date.now()}.png`, bannerImageFile);
            updateData.bannerImage = bannerUrl;
            updateData.bannerImageData = null;
            responseData.bannerImage = bannerUrl;
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

