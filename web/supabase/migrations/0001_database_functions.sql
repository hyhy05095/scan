CREATE SCHEMA IF NOT EXISTS "private";--> statement-breakpoint
REVOKE ALL ON SCHEMA "private" FROM PUBLIC;--> statement-breakpoint
REVOKE ALL ON SCHEMA "private" FROM "anon", "authenticated", "service_role";--> statement-breakpoint

CREATE FUNCTION "private"."handle_sign_up"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO "public"."profiles" (
    "profile_id",
    "name",
    "avatar_url",
    "marketing_consent"
  )
  VALUES (
    NEW."id",
    COALESCE(
      NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'name'), ''),
      NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'full_name'), ''),
      'Anonymous'
    ),
    NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'avatar_url'), ''),
    COALESCE(LOWER(NEW."raw_user_meta_data" ->> 'marketing_consent') = 'true', false)
  );

  RETURN NEW;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."handle_sign_up"() FROM PUBLIC;--> statement-breakpoint

CREATE TRIGGER "create_profile_on_sign_up"
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION "private"."handle_sign_up"();--> statement-breakpoint

CREATE FUNCTION "private"."set_updated_at"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."set_updated_at"() FROM PUBLIC;--> statement-breakpoint

CREATE TRIGGER "set_profiles_updated_at"
BEFORE UPDATE ON "public"."profiles"
FOR EACH ROW
EXECUTE FUNCTION "private"."set_updated_at"();--> statement-breakpoint

CREATE TRIGGER "set_payments_updated_at"
BEFORE UPDATE ON "public"."payments"
FOR EACH ROW
EXECUTE FUNCTION "private"."set_updated_at"();
