import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { SessionUser } from '@/types/session';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session || (session.user as SessionUser)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const role = searchParams.get('role') || '';

        const where: Prisma.UserWhereInput = {};
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

        if (!session || (session.user as SessionUser)?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { userId } = await req.json();
        const adminId = (session.user as SessionUser)?.id;

        if (!adminId) {
            return new NextResponse('Admin ID not found', { status: 400 });
        }

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
                adminId,
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
