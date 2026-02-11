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
        const { banned } = await req.json();

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
                    adminId: (session.user as any).id,
                },
                create: {
                    userId,
                    reason: 'Banned by admin',
                    adminId: (session.user as any).id,
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
                adminId: (session.user as any).id,
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
