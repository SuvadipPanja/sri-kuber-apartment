import { supabase } from '../services/supabase';

const BUCKET = 'contact-photos';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MB  = 3;

export async function uploadContactPhoto(file, contactId) {
  if (!ALLOWED.includes(file.type))
    throw new Error('Only JPG, PNG, WebP or GIF images are allowed.');
  if (file.size > MAX_MB * 1024 * 1024)
    throw new Error(`Image must be under ${MAX_MB} MB.`);

  const ext      = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${contactId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl + '?t=' + Date.now();
}

export async function deleteContactPhoto(photoUrl) {
  if (!photoUrl) return;
  try {
    const filePath = photoUrl.split('/').pop().split('?')[0];
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch { /* silent */ }
}
