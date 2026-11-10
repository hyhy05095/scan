import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getSafeNextPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { hasLocale, localizePath } from "@/i18n/config";

const emailOtpTypes = new Set<EmailOtpType>([
  "email",
  "email_change",
  "invite",
  "magiclink",
  "recovery",
  "signup",
]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const [{ lang }] = await Promise.all([params]);
  const requestUrl = new URL(request.url);

  if (!hasLocale(lang)) {
    return NextResponse.redirect(
      new URL("/login?error=confirmation", requestUrl.origin),
    );
  }

  const nextPath = getSafeNextPath(
    requestUrl.searchParams.get("next"),
    localizePath(lang, "/"),
  );
  const supabase = await createClient();
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  let error = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    ));
  } else if (tokenHash && type && emailOtpTypes.has(type)) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else {
    return NextResponse.redirect(
      new URL(
        `${localizePath(lang, "/login")}?error=confirmation`,
        requestUrl.origin,
      ),
    );
  }

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${localizePath(lang, "/login")}?error=confirmation`,
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
