import prisma from './prisma';

/**
 * Converts a File object to a Buffer for database storage.
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
    const bytes = await file.arrayBuffer();
    return Buffer.from(bytes);
}

/**
 * Returns a data URI for binary data stored in the database.
 * This can be used in <img src="..."> directly.
 */
export function bufferToDataUri(buffer: Buffer | Uint8Array, mimeType: string): string {
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${mimeType};base64,${base64}`;
}
