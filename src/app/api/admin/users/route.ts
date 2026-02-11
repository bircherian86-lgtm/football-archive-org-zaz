import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search } },
                { name: { contains: search } }
            ];
        }
        if (role) {
            where.role = role;
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                banned: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { userId } = await req.json();

        // Delete user's clips first (Prisma handles cascading if configured, but let's be explicit if not)
        await prisma.clip.deleteMany({
            where: { userId }
        });

        // Delete user
        await prisma.user.delete({
            where: { id: userId }
        });

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId: (session.user as any).id,
                action: 'DELETE_USER',
                details: `User ${userId} deleted`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
