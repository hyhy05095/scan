import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { hasLocale, localizePath } from "@/i18n/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  const requestUrl = new URL(request.url);

  if (!hasLocale(lang)) {
    return NextResponse.redirect(
      new URL("/login?error=social", requestUrl.origin),
    );
  }

  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    localizePath(lang, "/"),
  );

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `${localizePath(lang, "/login")}?error=social`,
        requestUrl.origin,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${localizePath(lang, "/login")}?error=social`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
