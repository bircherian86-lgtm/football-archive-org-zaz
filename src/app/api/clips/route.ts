import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { bufferToDataUri } from "@/lib/storage";

export async function GET() {
    try {
        const clips = await prisma.clip.findMany({
            orderBy: {
                uploadDate: 'desc'
            }
        });

        const processedClips = clips.map((clip: any) => {
            const processed = { ...clip };
            if (processed.thumbnailData) {
                processed.thumbnailUrl = bufferToDataUri(processed.thumbnailData, 'image/png');
            }
            // Do not send binary video data in the list view
            delete processed.thumbnailData;
            delete processed.fileData;
            return processed;
        });

        return NextResponse.json(processedClips);
    } catch (error) {
        console.error("Error fetching clips:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

