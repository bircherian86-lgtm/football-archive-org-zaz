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

        const { id: userId } = await params;
        const { role } = await req.json();
        const adminId = (session.user as SessionUser)?.id;

        if (!adminId) {
            return new NextResponse('Admin ID not found', { status: 400 });
        }

        if (!['USER', 'ADMIN'].includes(role)) {
            return new NextResponse('Invalid role', { status: 400 });
        }

        // Update user role
        await prisma.user.update({
            where: { id: userId },
            data: { role }
        });

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId,
                action: 'CHANGE_ROLE',
                details: `Role changed to ${role} for user ${userId}`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error changing role:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
