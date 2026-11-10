-- Restore Supaplate's user-id avatar filenames, while allowing files uploaded
-- before this correction to remain editable by their owner.
ALTER POLICY "avatars-insert-own-folder" ON "storage"."objects"
WITH CHECK (
  "bucket_id" = 'avatars'
  AND ("name" = (SELECT auth.uid()::text)
    OR "name" = (SELECT auth.uid()::text) || '/avatar')
);--> statement-breakpoint

ALTER POLICY "avatars-update-own" ON "storage"."objects"
WITH CHECK (
  "bucket_id" = 'avatars'
  AND "owner_id" = (SELECT auth.uid()::text)
  AND ("name" = (SELECT auth.uid()::text)
    OR "name" = (SELECT auth.uid()::text) || '/avatar')
);--> statement-breakpoint

-- Preserve the original signup defaults for new profiles only. Never change
-- an existing user's marketing preference during this migration.
CREATE OR REPLACE FUNCTION "private"."handle_sign_up"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("profile_id", "name", "avatar_url", "marketing_consent")
  VALUES (
    NEW."id",
    COALESCE(
      NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'name'), ''),
      NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'display_name'), ''),
      NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'full_name'), ''),
      'Anonymous'
    ),
    NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'avatar_url'), ''),
    CASE WHEN NEW."raw_app_meta_data" ->> 'provider' IN ('email', 'phone')
      THEN COALESCE(LOWER(NEW."raw_user_meta_data" ->> 'marketing_consent') = 'true', false)
      ELSE true
    END
  );
  RETURN NEW;
END;
$$;
