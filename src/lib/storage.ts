import { supabase } from './supabase';

/**
 * Generate a signed URL for a file in a private storage bucket.
 * Used for chat-files, assignment-submissions, and other private buckets.
 * Signed URLs expire after the specified duration (default: 1 hour).
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`Failed to create signed URL for ${bucket}/${path}:`, error);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error(`Error creating signed URL for ${bucket}/${path}:`, err);
    return null;
  }
}

/**
 * Generate signed URLs for multiple files at once.
 */
export async function getSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 3600
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};

  // Process in batches to avoid too many concurrent requests
  const batchSize = 10;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (path) => {
        const url = await getSignedUrl(bucket, path, expiresIn);
        return { path, url };
      })
    );
    batchResults.forEach(({ path, url }) => {
      result[path] = url;
    });
  }

  return result;
}

/**
 * Get a signed URL for chat files.
 * Chat files are stored in the private 'chat-files' bucket.
 */
export async function getChatFileSignedUrl(path: string): Promise<string | null> {
  return getSignedUrl('chat-files', path, 3600); // 1 hour
}

/**
 * Get a signed URL for assignment submission files.
 * Submissions are stored in the private 'assignment-submissions' bucket.
 */
export async function getSubmissionSignedUrl(path: string): Promise<string | null> {
  return getSignedUrl('assignment-submissions', path, 3600); // 1 hour
}

/**
 * Get a signed URL for resource files.
 * Resources may be in a private bucket.
 */
export async function getResourceSignedUrl(path: string): Promise<string | null> {
  return getSignedUrl('resources', path, 7200); // 2 hours
}

/**
 * Check if a URL is a storage path (not a full URL).
 * Storage paths look like: "folder/uuid.ext"
 * Full URLs start with "http" or "https".
 */
export function isStoragePath(urlOrPath: string): boolean {
  return !urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://');
}

/**
 * Resolve a file URL - if it's already a full URL, return it.
 * If it's a storage path, generate a signed URL.
 */
export async function resolveFileUrl(
  bucket: string,
  urlOrPath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!urlOrPath) return null;

  // If it's already a full URL, return as-is
  if (!isStoragePath(urlOrPath)) {
    return urlOrPath;
  }

  // It's a storage path, generate signed URL
  return getSignedUrl(bucket, urlOrPath, expiresIn);
}
