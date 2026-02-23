-- ============================================================
-- BC Insta App - Supabase Schema Setup
-- Supabase管理画面の「SQL Editor」にコピペして「Run」を押してください
-- ============================================================


-- ============================================================
-- 1. posts テーブルの作成
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url   TEXT,
  caption     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'published'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 2. Row Level Security (RLS) を無効化（開発初期段階）
--    ※ 本番公開前には必ず適切なポリシーを設定してください
-- ============================================================
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;


-- ============================================================
-- 3. Storage バケット「post-images」の作成（公開バケット）
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 4. Storage バケット「post-images」のパブリックアクセスポリシー
-- ============================================================

-- SELECT（誰でも閲覧可）
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- INSERT（誰でもアップロード可）
CREATE POLICY "Public upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images');

-- UPDATE（誰でも更新可）
CREATE POLICY "Public update access"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-images');

-- DELETE（誰でも削除可）
CREATE POLICY "Public delete access"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images');
