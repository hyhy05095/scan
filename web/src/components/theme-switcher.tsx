"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

import type { Theme } from "@/lib/theme";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeLabels = Record<Theme, string> & { label: string };

function readTheme(): Theme {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("theme="))
    ?.split("=")[1];
  return value === "system" || value === "light" ? value : "dark";
}
function applyTheme(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
const icons = { light: SunIcon, dark: MoonIcon, system: MonitorIcon };
function subscribe(listener: () => void) {
  window.addEventListener("theme-change", listener);
  return () => window.removeEventListener("theme-change", listener);
}
export function ThemeSwitcher({ labels }: { labels: ThemeLabels }) {
  const theme = useSyncExternalStore(
    subscribe,
    readTheme,
    () => "dark" as Theme,
  );
  useEffect(() => {
    applyTheme(theme);
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => theme === "system" && applyTheme("system");
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [theme]);
  const Icon = icons[theme];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild data-testid="theme-switcher">
        <Button variant="ghost" size="icon" aria-label={labels.label}>
          <Icon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(["light", "dark", "system"] as const).map((nextTheme) => {
          const OptionIcon = icons[nextTheme];
          return (
            <DropdownMenuItem
              key={nextTheme}
              onClick={() => {
                document.cookie =
                  "theme=" +
                  nextTheme +
                  "; path=/; max-age=31536000; SameSite=Lax";
                window.dispatchEvent(new Event("theme-change"));
              }}
            >
              <OptionIcon className="size-4" />
              {labels[nextTheme]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
