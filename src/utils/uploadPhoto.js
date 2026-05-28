import { supabase } from '../services/supabase';

const BUCKET = 'profile-photos';

/**
 * Upload a profile photo to Supabase Storage.
 * @param {File} file - The image file to upload
 * @param {string} flatNo - The flat number (used as filename)
 * @returns {{ url: string } | { error: string }}
 */
export async function uploadProfilePhoto(file, flatNo) {
  // Validate file
  if (!file) return { error: 'No file selected.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPG, PNG, WebP or GIF images are allowed.' };
  }

  const maxSize = 2 * 1024 * 1024; // 2 MB
  if (file.size > maxSize) {
    return { error: 'Image must be smaller than 2 MB.' };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${flatNo}.${ext}`;

    // Upload (upsert to replace existing)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl + '?t=' + Date.now(); // cache bust

    // Save URL to owners table
    const { error: dbError } = await supabase
      .from('owners')
      .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('flat_no', flatNo);

    if (dbError) throw dbError;

    return { url: publicUrl };
  } catch (err) {
    console.error('Upload error:', err);
    return { error: err.message || 'Upload failed. Please try again.' };
  }
}
