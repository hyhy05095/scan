"use client";

import type { User } from "@supabase/supabase-js";
import {
  CogIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { appName } from "@/lib/app-config";
import { createClient } from "@/lib/supabase/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { logoutAction } from "@/features/auth/actions";
import { type Locale, localizePath } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function SiteHeader({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const [user, setUser] = useState<User | null | undefined>(() =>
    hasSupabaseConfig ? undefined : null,
  );
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) setUser(nextSession?.user ?? null);
      },
    );
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [hasSupabaseConfig]);

  const navigation = (
    <NavigationLinks dictionary={dictionary} locale={locale} />
  );
  const actions = <UtilityActions dictionary={dictionary} locale={locale} />;
  const auth = <AuthArea dictionary={dictionary} locale={locale} user={user} />;

  return (
    <header className="bg-background/95 border-b backdrop-blur">
      <nav
        className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6"
        aria-label="Primary navigation"
      >
        <Link
          className="mr-auto font-extrabold tracking-tight"
          href={localizePath(locale)}
        >
          {appName}
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {navigation}
          <Separator className="mx-2 h-5" orientation="vertical" />
          {actions}
          <Separator className="mx-2 h-5" orientation="vertical" />
          {auth}
        </div>
        <div className="md:hidden">
          <Sheet onOpenChange={setNavigationOpen} open={navigationOpen}>
            <SheetTrigger asChild>
              <Button aria-label="Open navigation" size="icon" variant="ghost">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent
              className="flex flex-col"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest("a")) {
                  setNavigationOpen(false);
                }
              }}
              side="right"
            >
              <SheetHeader>
                <SheetTitle>{appName}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-1 flex-col items-stretch gap-3 px-4 [&_a]:justify-start">
                {navigation}
              </div>
              <SheetFooter>
                <div className="flex items-center justify-between gap-3">
                  {actions}
                </div>
                <div className="grid gap-2">{auth}</div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

function NavigationLinks({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      {[
        [dictionary.navigation.scan, "/scan"],
        [dictionary.navigation.blog, "/blog"],
        [dictionary.navigation.contact, "/contact"],
        [dictionary.payments.checkoutTitle, "/payments/checkout"],
      ].map(([label, path]) => (
        <Button asChild key={path} variant="ghost">
          <Link href={localizePath(locale, path)}>{label}</Link>
        </Button>
      ))}
    </>
  );
}

function UtilityActions({
  dictionary,
  locale,
}: {
  dictionary: Dictionary;
  locale: Locale;
}) {
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button aria-label="Debug integrations" size="icon" variant="ghost">
            <CogIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={localizePath(locale, "/debug/sentry")}>Sentry</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={localizePath(locale, "/debug/analytics")}>
              Google Analytics
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LocaleSwitcher
        labels={{
          label: dictionary.navigation.language,
          en: dictionary.navigation.english,
          es: dictionary.navigation.spanish,
          ko: dictionary.navigation.korean,
          zh: dictionary.navigation.chinese,
          ja: dictionary.navigation.japanese,
          ru: dictionary.navigation.russian,
        }}
        locale={locale}
      />
      <ThemeSwitcher labels={dictionary.theme} />
    </>
  );
}

function AuthArea({
  dictionary,
  locale,
  user,
}: {
  dictionary: Dictionary;
  locale: Locale;
  user: User | null | undefined;
}) {
  const router = useRouter();
  const logout = useAction(logoutAction, {
    onError() {
      toast.error("Could not log out. Please try again.");
    },
    onSuccess() {
      router.replace(localizePath(locale, "/"));
      router.refresh();
    },
  });

  if (user === undefined)
    return (
      <div
        aria-label="Loading account"
        className="bg-muted size-8 animate-pulse rounded-lg"
      />
    );
  if (!user)
    return (
      <>
        <Button asChild variant="ghost">
          <Link href={localizePath(locale, "/login")}>
            {dictionary.navigation.login}
          </Link>
        </Button>
        <Button asChild>
          <Link href={localizePath(locale, "/join")}>
            {dictionary.navigation.join}
          </Link>
        </Button>
      </>
    );

  const metadata = user.user_metadata;
  const name =
    [metadata.name, metadata.display_name, metadata.full_name].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? "Anonymous";
  const avatarUrl =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : undefined;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`${name} account menu`} type="button">
          <Avatar className="cursor-pointer rounded-lg">
            <AvatarImage alt={name} src={avatarUrl} />
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="grid">
          <span className="truncate font-semibold">{name}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={localizePath(locale, "/dashboard")}>
            <LayoutDashboardIcon />
            {dictionary.navigation.dashboard}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={logout.isPending}
          onSelect={() => logout.execute()}
        >
          <LogOutIcon />
          {dictionary.dashboard.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
