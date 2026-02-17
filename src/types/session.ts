// Shared types for NextAuth session user
export interface SessionUser {
    id?: string;
    role?: string;
    email?: string;
    name?: string;
    profilePicture?: string | null;
    displayName?: string | null;
    bannerImage?: string | null;
    bio?: string | null;
}
