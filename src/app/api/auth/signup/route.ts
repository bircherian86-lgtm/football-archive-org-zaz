import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const { name, email, password } = await req.json();

        // Validate input
        if (!email || !password) {
            return new NextResponse("Email and password are required", { status: 400 });
        }

        if (password.length < 6) {
            return new NextResponse("Password must be at least 6 characters", { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user ID
        const userId = randomBytes(16).toString('hex');

        // Insert user into database using Prisma
        await prisma.user.create({
            data: {
                id: userId,
                email,
                name: name || null,
                password: hashedPassword,
                role: 'USER',
                createdAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            user: { id: userId, email, name }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
