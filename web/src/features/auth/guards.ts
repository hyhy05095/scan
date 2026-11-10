import { redirect } from "next/navigation";
import "server-only";

import { createClient } from "@/lib/supabase/server";

import { type Locale, localizePath } from "@/i18n/config";

export async function redirectAuthenticatedUser(locale: Locale) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims.sub) {
    redirect(localizePath(locale, "/"));
  }
}
