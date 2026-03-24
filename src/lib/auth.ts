import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";


// Admin hardcoded credentials
const ADMIN_USERNAME = "zazaep21";
const ADMIN_PASSWORD = "bedwars2133";


async function getUser(email: string) {
    try {
        return await prisma.user.findUnique({
            where: { email }
        });
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
    debug: true,
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                const emailOrUsername = credentials?.email as string;
                const password = credentials?.password as string;

                console.log('Authorize attempt:', { emailOrUsername, hasPassword: !!password });

                // Check for admin login (username)
                if (emailOrUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                    console.log('Admin login success');
                    return {
                        id: "admin",
                        name: "Admin",
                        email: ADMIN_USERNAME,
                        role: "ADMIN",
                    };
                }

                // Try to parse as email for regular user login
                const emailValidation = z.string().email().safeParse(emailOrUsername);

                if (emailValidation.success) {
                    console.log('Email validation success, fetching user');
                    // It's a valid email, look up user
                    const user = await getUser(emailValidation.data);
                    if (user && password) {
                        console.log('User found in DB, comparing passwords');
                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            console.log('Login success for user:', user.email);
                            return {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role || "USER",
                                profilePicture: user.profilePicture?.startsWith('data:') ? `/api/user/image?type=pfp&userId=${user.id}` : (user.profilePicture || `/api/user/image?type=pfp&userId=${user.id}`),
                                displayName: user.displayName,
                                bannerImage: user.bannerImage?.startsWith('data:') ? `/api/user/image?type=banner&userId=${user.id}` : (user.bannerImage || `/api/user/image?type=banner&userId=${user.id}`),
                                bio: user.bio,
                            };
                        } else {
                            console.log('Password mismatch for user:', user.email);
                        }
                    } else {
                        console.log('User not found or password missing');
                    }
                } else {
                    console.log('Email validation failed for:', emailOrUsername);
                }

                console.log('Authorize returning null');
                return null;
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // When user first signs in
            if (user) {
                token.role = user.role;
                token.id = user.id;
                token.profilePicture = user.profilePicture;
                token.displayName = user.displayName;
                token.bannerImage = user.bannerImage;
                token.bio = user.bio;
            }

            // Handle session update trigger
            if (trigger === "update" && session) {
                token.displayName = session.displayName || token.displayName;
                token.profilePicture = session.profilePicture || token.profilePicture;
                token.bannerImage = session.bannerImage || token.bannerImage;
                token.bio = session.bio || token.bio;
            }

            // Fetch fresh metadata from DB periodically/on refresh to ensure persistence
            if (token.id && token.id !== "admin") {
                try {
                    const freshUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: {
                            profilePicture: true,
                            displayName: true,
                            bannerImage: true,
                            bio: true
                        }
                    });

                    if (freshUser) {
                        // Use the image or a light URL to the image API
                        token.profilePicture = freshUser.profilePicture || `/api/user/image?type=pfp&userId=${token.id}&t=${Date.now()}`;
                        token.displayName = freshUser.displayName || token.displayName;
                        token.bannerImage = freshUser.bannerImage || `/api/user/image?type=banner&userId=${token.id}&t=${Date.now()}`;
                        token.bio = freshUser.bio || token.bio;
                    }
                } catch (e) {
                    console.error("JWT refresh error:", e);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string | undefined;
                session.user.profilePicture = token.profilePicture as string | null | undefined;
                session.user.displayName = token.displayName as string | null | undefined;
                session.user.bannerImage = token.bannerImage as string | null | undefined;
                session.user.bio = token.bio as string | null | undefined;
            }
            return session;
        }
    }
});
