import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

// Admin hardcoded credentials
const ADMIN_USERNAME = "zazaep21";
const ADMIN_PASSWORD = "bedwars2133";

declare module "next-auth" {
    interface User {
        role?: string;
        profilePicture?: string | null;
        displayName?: string | null;
        bannerImage?: string | null;
        bio?: string | null;
    }
    interface Session {
        user: User;
    }
    // Often JWT is also available under "next-auth" in some versions, but standard is next-auth/jwt
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        profilePicture?: string | null;
        displayName?: string | null;
        bannerImage?: string | null;
        bio?: string | null;
    }
}

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

                // Check for admin login (username)
                if (emailOrUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
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
                    // It's a valid email, look up user
                    const user = await getUser(emailValidation.data);
                    if (user && password) {
                        const passwordsMatch = await bcrypt.compare(password, user.password);
                        if (passwordsMatch) {
                            return {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role || "USER",
                                profilePicture: user.profilePicture,
                                displayName: user.displayName,
                                bannerImage: user.bannerImage,
                                bio: user.bio,
                            };
                        }
                    }
                }

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

            // Fetch fresh data from DB periodically/on refresh to ensure persistence
            if (token.id) {
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
                        token.profilePicture = freshUser.profilePicture || token.profilePicture;
                        token.displayName = freshUser.displayName || token.displayName;
                        token.bannerImage = freshUser.bannerImage || token.bannerImage;
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
                session.user.role = token.role;
                session.user.profilePicture = token.profilePicture;
                session.user.displayName = token.displayName;
                session.user.bannerImage = token.bannerImage;
                session.user.bio = token.bio;
            }
            return session;
        }
    }
});
