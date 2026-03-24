import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { bufferToDataUri } from "@/lib/storage";

export async function GET() {
    try {
        const clips = await prisma.clip.findMany({
            orderBy: {
                uploadDate: 'desc'
            },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                thumbnailData: true,
                fileUrl: true,
                fileName: true,
                tags: true,
                fileSize: true,
                userId: true,
                uploadDate: true,
                featured: true,
                // Intentionally exclude fileData to avoid fetching large binary blobs
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processedClips = clips.map((clip: any) => {
            const processed = { ...clip };
            if (processed.thumbnailData) {
                processed.thumbnailUrl = bufferToDataUri(processed.thumbnailData, 'image/png');
            }

            // Use direct Blob URL if it exists, otherwise use streaming proxy
            if (!processed.fileUrl || !processed.fileUrl.startsWith('http')) {
                processed.fileUrl = `/api/clips/${processed.id}/video`;
            }

            // Do not send binary data in the list view
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

