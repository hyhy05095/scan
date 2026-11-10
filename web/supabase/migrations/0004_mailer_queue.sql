CREATE EXTENSION IF NOT EXISTS "pgmq";--> statement-breakpoint

-- Durable queues: active welcome-email jobs and terminal failures for review.
SELECT "pgmq"."create"('mailer');--> statement-breakpoint
SELECT "pgmq"."create"('mailer_dead_letters');--> statement-breakpoint

ALTER TABLE "pgmq"."q_mailer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pgmq"."a_mailer" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pgmq"."q_mailer_dead_letters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pgmq"."a_mailer_dead_letters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

REVOKE ALL ON TABLE
  "pgmq"."q_mailer",
  "pgmq"."a_mailer",
  "pgmq"."q_mailer_dead_letters",
  "pgmq"."a_mailer_dead_letters"
FROM PUBLIC, "anon", "authenticated";--> statement-breakpoint

CREATE FUNCTION "private"."enqueue_welcome_email"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  preferred_locale text;
  recipient_name text;
BEGIN
  IF NEW."email" IS NULL THEN
    RETURN NEW;
  END IF;

  preferred_locale := CASE NEW."raw_user_meta_data" ->> 'locale'
    WHEN 'es' THEN 'es'
    WHEN 'ko' THEN 'ko'
    ELSE 'en'
  END;
  recipient_name := COALESCE(
    NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'name'), ''),
    NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'display_name'), ''),
    NULLIF(BTRIM(NEW."raw_user_meta_data" ->> 'full_name'), ''),
    'there'
  );

  PERFORM "pgmq"."send"(
    queue_name => 'mailer',
    msg => jsonb_build_object(
      'eventId', NEW."id"::text,
      'template', 'welcome',
      'to', NEW."email",
      'data', jsonb_build_object(
        'locale', preferred_locale,
        'name', recipient_name
      )
    )
  );

  RETURN NEW;
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION "private"."enqueue_welcome_email"() FROM PUBLIC;--> statement-breakpoint

CREATE TRIGGER "enqueue_welcome_email_on_sign_up"
AFTER INSERT ON "auth"."users"
FOR EACH ROW
EXECUTE FUNCTION "private"."enqueue_welcome_email"();
