import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const clips = await prisma.clip.findMany({
            orderBy: {
                uploadDate: 'desc'
            }
        });

        return NextResponse.json(clips);
    } catch (error) {
        console.error("Error fetching clips:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
