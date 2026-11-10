INSERT INTO "storage"."buckets" (
  "id",
  "name",
  "public",
  "file_size_limit",
  "allowed_mime_types"
)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT ("id") DO UPDATE
SET
  "public" = EXCLUDED."public",
  "file_size_limit" = EXCLUDED."file_size_limit",
  "allowed_mime_types" = EXCLUDED."allowed_mime_types";--> statement-breakpoint

CREATE POLICY "avatars-select-own"
ON "storage"."objects"
AS PERMISSIVE
FOR SELECT
TO "authenticated"
USING (
  "bucket_id" = 'avatars'
  AND "owner_id" = (SELECT auth.uid()::text)
);--> statement-breakpoint

CREATE POLICY "avatars-insert-own-folder"
ON "storage"."objects"
AS PERMISSIVE
FOR INSERT
TO "authenticated"
WITH CHECK (
  "bucket_id" = 'avatars'
  AND (storage.foldername("name"))[1] = (SELECT auth.uid()::text)
);--> statement-breakpoint

CREATE POLICY "avatars-update-own"
ON "storage"."objects"
AS PERMISSIVE
FOR UPDATE
TO "authenticated"
USING (
  "bucket_id" = 'avatars'
  AND "owner_id" = (SELECT auth.uid()::text)
)
WITH CHECK (
  "bucket_id" = 'avatars'
  AND "owner_id" = (SELECT auth.uid()::text)
  AND (storage.foldername("name"))[1] = (SELECT auth.uid()::text)
);--> statement-breakpoint

CREATE POLICY "avatars-delete-own"
ON "storage"."objects"
AS PERMISSIVE
FOR DELETE
TO "authenticated"
USING (
  "bucket_id" = 'avatars'
  AND "owner_id" = (SELECT auth.uid()::text)
);
