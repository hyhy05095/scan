import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getAccountData() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return null;
  }

  const user = userData.user;
  const [
    { data: profile, error: profileError },
    { data: identityData, error: identityError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("name, avatar_url, marketing_consent")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase.auth.getUserIdentities(),
  ]);

  if (profileError || identityError) {
    throw profileError ?? identityError;
  }

  const metadata = user.user_metadata;
  const fallbackName = [
    metadata.name,
    metadata.display_name,
    metadata.full_name,
  ].find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  const fallbackAvatar =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  return {
    avatarUrl: profile?.avatar_url ?? fallbackAvatar,
    email: user.email ?? "",
    hasPassword: identityData.identities.some(
      (identity) => identity.provider === "email",
    ),
    marketingConsent: profile?.marketing_consent ?? false,
    name: profile?.name ?? fallbackName ?? "Anonymous",
    providers: identityData.identities
      .map((identity) => identity.provider)
      .filter(
        (provider): provider is "apple" | "github" | "google" | "kakao" =>
          provider === "apple" ||
          provider === "github" ||
          provider === "google" ||
          provider === "kakao",
      ),
  };
}
