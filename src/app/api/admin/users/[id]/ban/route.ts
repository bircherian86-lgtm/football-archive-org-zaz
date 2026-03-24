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
        const { banned } = await req.json();
        const adminId = (session.user as SessionUser)?.id;

        if (!adminId) {
            return new NextResponse('Admin ID not found', { status: 400 });
        }

        // Update user banned status
        await prisma.user.update({
            where: { id: userId },
            data: { banned: !!banned }
        });

        if (banned) {
            // Add to bans table
            await prisma.userBan.upsert({
                where: { userId },
                update: {
                    reason: 'Banned by admin',
                    adminId,
                },
                create: {
                    userId,
                    reason: 'Banned by admin',
                    adminId,
                }
            });
        } else {
            // Remove from bans table
            await prisma.userBan.delete({
                where: { userId }
            }).catch(() => {
                // Ignore if record doesn't exist
            });
        }

        // Log the action
        await prisma.adminLog.create({
            data: {
                adminId,
                action: banned ? 'BAN_USER' : 'UNBAN_USER',
                details: banned ? `User ${userId} banned` : `User ${userId} unbanned`
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error banning user:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
