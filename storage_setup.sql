-- 1. Create a storage bucket for recipes
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipes', 'recipes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS for storage.objects (Skipped: usually already enabled and requires superuser)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone can view images (public)
-- 3. Policy: Anyone can view images (public)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'recipes' );

-- 4. Policy: Anyone can upload (dev mode / anon access)
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipes'
);

-- 5. Policy: Anyone can delete/update (dev mode)
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'recipes' );

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'recipes' );

-- 6. Add image_url to recipes table if not exists
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'recipes' AND column_name = 'image_url') THEN
    ALTER TABLE recipes ADD COLUMN image_url TEXT;
  END IF;
END $$;
