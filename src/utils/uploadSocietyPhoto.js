import { supabase } from '../services/supabase';

const BUCKET = 'society-photos';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MB = 3;

export function isSocietyStorageUrl(url) {
  return typeof url === 'string' && url.includes(`/${BUCKET}/`);
}

/**
 * Upload a society gallery image to Supabase Storage.
 * @param {File} file
 * @param {string} photoId - stable gallery item id (used in filename)
 */
export async function uploadSocietyPhoto(file, photoId) {
  if (!file) throw new Error('No file selected.');
  if (!ALLOWED.includes(file.type)) {
    throw new Error('Only JPG, PNG, WebP or GIF images are allowed.');
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`Image must be under ${MAX_MB} MB.`);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${photoId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl + '?t=' + Date.now();
}

/** Remove uploaded file from storage when URL points to our bucket. */
export async function deleteSocietyPhoto(photoUrl) {
  if (!isSocietyStorageUrl(photoUrl)) return;
  try {
    const filePath = photoUrl.split('/').pop().split('?')[0];
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch {
    /* silent */
  }
}
