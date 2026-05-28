import { supabase } from '../services/supabase';

const BUCKET = 'expense-attachments';

/**
 * Upload a bill/receipt photo for an expense to Supabase Storage.
 * @param {File} file - The image or PDF file
 * @param {string} expenseId - Used as the filename key
 * @returns {{ url: string } | { error: string }}
 */
export async function uploadExpenseAttachment(file, expenseId) {
  if (!file) return { error: 'No file selected.' };

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPG, PNG, WebP, GIF or PDF files are allowed.' };
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return { error: 'File must be smaller than 5 MB.' };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${expenseId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return { url: urlData.publicUrl + '?t=' + Date.now() };
  } catch (err) {
    console.error('Expense attachment upload error:', err);
    return { error: err.message || 'Upload failed. Please try again.' };
  }
}
