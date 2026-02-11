import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = params.id;
        const { role } = await req.json();

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
                adminId: (session.user as any).id,
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
