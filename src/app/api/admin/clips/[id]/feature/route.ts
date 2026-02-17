import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();

        if (!session || (session.user as SessionUser)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: clipId } = await params;
        const { featured } = await req.json();
        const adminId = (session.user as SessionUser)?.id;

        if (!adminId) {
            return new NextResponse('Admin ID not found', { status: 400 });
        }

        // Update clip featured status
        await prisma.clip.update({
            where: { id: clipId },
            data: { featured: !!featured }
        });

        // Handle featured_clips table
        if (featured) {
            await prisma.featuredClip.upsert({
                where: { clipId },
                update: {},
                create: { clipId }
            });
        } else {
            await prisma.featuredClip.delete({
                where: { clipId }
            }).catch(() => { });
        }

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId,
                action: featured ? 'FEATURE_CLIP' : 'UNFEATURE_CLIP',
                details: `Clip ${clipId} ${featured ? 'featured' : 'unfeatured'}`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error featuring clip:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
