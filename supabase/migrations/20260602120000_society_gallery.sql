-- Society Info gallery images (managed from Admin → Society Settings)
ALTER TABLE public.config
ADD COLUMN IF NOT EXISTS society_gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.config.society_gallery IS
  'Array of { id, url, caption, sort_order } for Society Info page photos';

-- Create public storage bucket (Supabase Dashboard → Storage → New bucket)
-- Name: society-photos | Public: true
-- Or run:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('society-photos', 'society-photos', true)
-- ON CONFLICT (id) DO NOTHING;
