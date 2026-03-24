import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a file to a Supabase bucket and returns the public URL.
 * @param bucket - The Supabase storage bucket name.
 * @param path - The path/filename in the bucket.
 * @param file - The file to upload.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFile(bucket: string, path: string, file: File | Buffer | Uint8Array, contentType?: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: contentType || (file instanceof File ? file.type : 'application/octet-stream'),
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
