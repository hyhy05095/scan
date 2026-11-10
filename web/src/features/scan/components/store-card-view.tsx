"use client";

import {
  HandIcon,
  LightbulbIcon,
  NavigationIcon,
  RotateCcwIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import type { StoreCard, VeganLevel } from "@/features/scan/types";
import type { Dictionary } from "@/i18n/dictionaries";

type Labels = Dictionary["scan"];

const STAFF_MESSAGE_KO =
  "저는 비건이에요. 고기, 생선, 해산물, 젓갈, 계란, 우유, 고기·멸치 육수를 빼 주실 수 있나요?";

const veganStyle: Record<VeganLevel, string> = {
  likely:
    "border-green-600/30 bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  check:
    "border-yellow-600/30 bg-yellow-100 text-yellow-900 dark:bg-yellow-950 dark:text-yellow-200",
  hard: "border-red-600/30 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

const veganDot: Record<VeganLevel, string> = {
  likely: "bg-green-600",
  check: "bg-yellow-500",
  hard: "bg-red-600",
};

function veganLabel(level: VeganLevel, labels: Labels) {
  return {
    likely: labels.veganLikely,
    check: labels.veganCheck,
    hard: labels.veganHard,
  }[level];
}

function StaffOverlay({
  labels,
  onClose,
}: {
  labels: Labels;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      aria-modal="true"
      className="bg-background fixed inset-0 z-50 flex flex-col p-6"
      lang="ko"
      role="dialog"
    >
      <div className="flex justify-end">
        <Button onClick={onClose} size="lg" variant="outline">
          <XIcon />
          {labels.close}
        </Button>
      </div>
      <p className="flex flex-1 items-center text-4xl leading-snug font-bold break-keep sm:text-5xl">
        {STAFF_MESSAGE_KO}
      </p>
    </div>
  );
}

export function StoreCardView({
  store,
  labels,
  onRetry,
}: {
  store: StoreCard;
  labels: Labels;
  onRetry: () => void;
}) {
  const [staffOpen, setStaffOpen] = useState(false);
  const d = store.detail;
  const directions = `https://map.kakao.com/link/to/${encodeURIComponent(
    store.name_ko,
  )},${store.lat},${store.lng}`;

  return (
    <article className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight break-keep">
          {store.name_en || store.name_ko}
        </h2>
        {store.name_en ? (
          <p className="text-muted-foreground text-lg" lang="ko">
            {store.name_ko}
          </p>
        ) : null}
        <p className="text-muted-foreground text-sm">
          {[d?.cuisine, store.price_level].filter(Boolean).join(" · ")}
        </p>
      </header>

      {store.vegan ? (
        <section
          className={cn("rounded-xl border p-4", veganStyle[store.vegan])}
        >
          <p className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className={cn("size-3 rounded-full", veganDot[store.vegan])}
            />
            {labels.vegan}: {veganLabel(store.vegan, labels)}
          </p>
          {d?.vegan_note ? (
            <p className="mt-1 text-sm leading-6">{d.vegan_note}</p>
          ) : null}
        </section>
      ) : null}

      {d?.signature_menu.length ? (
        <section className="space-y-2">
          <h3 className="font-semibold">{labels.menu}</h3>
          <ul className="divide-y rounded-xl border">
            {d.signature_menu.map((item) => (
              <li className="px-4 py-3" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {d?.review_summary.length ? (
        <section className="space-y-2">
          <h3 className="font-semibold">{labels.reviews}</h3>
          <ul className="text-muted-foreground list-disc space-y-1 pl-5 leading-6">
            {d.review_summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {d?.tip ? (
        <section className="bg-muted flex gap-3 rounded-xl p-4">
          <LightbulbIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <h3 className="sr-only">{labels.tips}</h3>
            <p className="leading-6">{d.tip}</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3">
        <Button
          className="h-12 text-base"
          onClick={() => setStaffOpen(true)}
          size="lg"
        >
          <HandIcon />
          {labels.showStaff}
        </Button>
        <Button asChild className="h-12 text-base" size="lg" variant="outline">
          <a href={directions} rel="noopener noreferrer" target="_blank">
            <NavigationIcon />
            {labels.directions}
          </a>
        </Button>
        <Button
          className="h-12 text-base"
          onClick={onRetry}
          size="lg"
          variant="ghost"
        >
          <RotateCcwIcon />
          {labels.retry}
        </Button>
      </div>

      {staffOpen ? (
        <StaffOverlay labels={labels} onClose={() => setStaffOpen(false)} />
      ) : null}
    </article>
  );
}
