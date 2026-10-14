-- Public gallery bucket used by Admin → Society Settings.
-- The app uploads with the anon key, so anon needs insert, update, and delete.
INSERT INTO storage.buckets (id, name, public)
VALUES ('society-photos', 'society-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS society_photos_select ON storage.objects;
DROP POLICY IF EXISTS society_photos_insert ON storage.objects;
DROP POLICY IF EXISTS society_photos_update ON storage.objects;
DROP POLICY IF EXISTS society_photos_delete ON storage.objects;

CREATE POLICY society_photos_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'society-photos');

CREATE POLICY society_photos_insert ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'society-photos');

CREATE POLICY society_photos_update ON storage.objects
  FOR UPDATE
  TO anon
  USING (bucket_id = 'society-photos')
  WITH CHECK (bucket_id = 'society-photos');

CREATE POLICY society_photos_delete ON storage.objects
  FOR DELETE
  TO anon
  USING (bucket_id = 'society-photos');
