-- ============================================================
-- HARIOM STUDIO — Portfolio CRM Storage Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Create a public bucket named 'portfolio' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Create policy to allow public select/read access to 'portfolio' bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'portfolio');

-- 3. Create policy to allow public/authenticated insert/upload access
CREATE POLICY "Public Insert Access" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'portfolio');

-- 4. Create policy to allow updates
CREATE POLICY "Public Update Access" ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'portfolio')
  WITH CHECK (bucket_id = 'portfolio');

-- 5. Create policy to allow deletion
CREATE POLICY "Public Delete Access" ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'portfolio');
