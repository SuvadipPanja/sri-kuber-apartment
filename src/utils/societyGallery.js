/**
 * Normalize society gallery from config for display / admin editing.
 * Falls back to legacy society_photo_url and static defaults.
 */
export function normalizeGallery(config) {
  const stored = config?.society_gallery;
  if (Array.isArray(stored)) {
    return stored
      .filter((p) => p?.url)
      .map((p, i) => ({
        id: p.id || `gal_${i}`,
        url: p.url,
        caption: p.caption || 'Society Photo',
      }));
  }

  /* Legacy: before gallery column existed */
  const legacy = [];
  legacy.push({
    id: 'gal_maps',
    url: '/society_real.jpg',
    caption: 'Sri Kuber Apartment (Google Maps View)',
  });

  const frontUrl = config?.society_photo_url || '/society.png';
  legacy.push({
    id: 'gal_front',
    url: frontUrl,
    caption: 'Front Elevation',
  });

  return legacy;
}

/** Gallery rows shown on Society Info when config has no saved gallery. */
export function getSocietyGalleryPhotos(config) {
  const gallery = normalizeGallery(config);
  return gallery.map((p) => ({ src: p.url, caption: p.caption }));
}

export function galleryToPayload(gallery) {
  return gallery.map((p, i) => ({
    id: p.id,
    url: p.url,
    caption: p.caption || 'Society Photo',
    sort_order: i,
  }));
}
