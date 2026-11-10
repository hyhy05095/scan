"use client";

import {
  CameraIcon,
  LoaderCircleIcon,
  MapPinIcon,
  RotateCcwIcon,
  StoreIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { resizeToJpegBase64 } from "@/features/scan/lib/resize-image";
import type {
  IdentifyResponse,
  ScanLang,
  StoreCard,
} from "@/features/scan/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

import { StoreCardView } from "./store-card-view";

type Labels = Dictionary["scan"];

const CONFIDENT = 0.7;

// 위치 권한 거부·실패 시 수동 선택 → mode "area" (서버 반경 800m, 후보 40개)
const AREAS = {
  seochon: { lat: 37.5797, lng: 126.9707 },
  gyeongbokgung: { lat: 37.576, lng: 126.977 },
  bukchon: { lat: 37.5826, lng: 126.983 },
  anguk: { lat: 37.5765, lng: 126.9855 },
} as const;
type Area = keyof typeof AREAS;
const AREA_ACCURACY = 200;

type Location = {
  lat: number;
  lng: number;
  accuracy: number;
  area?: Area;
};

type View =
  | { name: "home" }
  | { name: "analyzing" }
  | { name: "card"; store: StoreCard }
  | { name: "choose"; result: IdentifyResponse }
  | { name: "notFound" }
  | { name: "error" };

export function ScanApp({
  labels,
  locale,
}: {
  labels: Labels;
  locale: Locale;
}) {
  // 가게 정보는 en/zh/ja/ru/es만 있음. ko(개발 확인용)는 en으로 대체
  const apiLang: ScanLang = locale === "ko" ? "en" : locale;

  const [location, setLocation] = useState<Location | null>(null);
  const [locStatus, setLocStatus] = useState<"locating" | "ok" | "denied">(
    "locating",
  );
  const [view, setView] = useState<View>({ name: "home" });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // 위치 API 없는 브라우저: 렌더 후 지역 선택 화면으로
      queueMicrotask(() => setLocStatus("denied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocStatus("ok");
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, []);

  const chooseArea = (area: Area) =>
    setLocation({ ...AREAS[area], accuracy: AREA_ACCURACY, area });

  const reset = useCallback(() => {
    setView({ name: "home" });
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file || !location) return;
    setView({ name: "analyzing" });
    try {
      const image = await resizeToJpegBase64(file);
      const res = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          mode: location.area ? "area" : "gps",
          lang: apiLang,
        }),
      });
      if (!res.ok) throw new Error(`identify ${res.status}`);
      const result = (await res.json()) as IdentifyResponse;

      if (result.store && result.confidence >= CONFIDENT) {
        setView({ name: "card", store: result.store });
      } else if (result.alternatives.length > 0) {
        setView({ name: "choose", result });
      } else {
        setView({ name: "notFound" });
      }
    } catch (caught) {
      console.error("[scan]", caught);
      setView({ name: "error" });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function pickAlternative(result: IdentifyResponse, store: StoreCard) {
    setView({ name: "card", store });
    if (result.log_id != null) {
      // 실패해도 화면에는 영향 없음
      void fetch("/api/scan-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: result.log_id, store_id: store.id }),
      }).catch(() => {});
    }
  }

  const areaLabel: Record<Area, string> = {
    seochon: labels.areaSeochon,
    gyeongbokgung: labels.areaGyeongbokgung,
    bukchon: labels.areaBukchon,
    anguk: labels.areaAnguk,
  };

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      {/* 숨긴 파일 입력: 모바일은 카메라, PC는 파일 선택 */}
      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        ref={fileRef}
        type="file"
      />

      {view.name === "home" ? (
        <div className="space-y-8">
          <header className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              {labels.title}
            </h1>
            <p className="text-muted-foreground leading-7">{labels.subtitle}</p>
          </header>

          <LocationStatus
            areaLabel={areaLabel}
            labels={labels}
            location={location}
            onChooseArea={chooseArea}
            status={locStatus}
          />

          <Button
            className="h-16 w-full text-lg"
            disabled={!location}
            onClick={() => fileRef.current?.click()}
            size="lg"
          >
            <CameraIcon className="size-6" />
            {labels.takePhoto}
          </Button>
        </div>
      ) : null}

      {view.name === "analyzing" ? (
        <div
          aria-live="polite"
          className="flex flex-col items-center gap-4 py-24 text-center"
        >
          <LoaderCircleIcon className="text-primary size-12 animate-spin" />
          <p className="text-lg">{labels.analyzing}</p>
        </div>
      ) : null}

      {view.name === "card" ? (
        <StoreCardView labels={labels} onRetry={reset} store={view.store} />
      ) : null}

      {view.name === "choose" ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            {labels.notSure}
          </h2>
          <div className="grid gap-3">
            {view.result.alternatives.map((store) => (
              <Button
                className="h-auto justify-between px-4 py-4 text-left"
                key={store.id}
                onClick={() => pickAlternative(view.result, store)}
                variant="outline"
              >
                <span className="min-w-0">
                  <span className="block truncate text-base font-semibold">
                    {store.name_en || store.name_ko}
                  </span>
                  {store.name_en ? (
                    <span
                      className="text-muted-foreground block truncate text-sm"
                      lang="ko"
                    >
                      {store.name_ko}
                    </span>
                  ) : null}
                </span>
                <span className="text-muted-foreground shrink-0 text-sm">
                  {store.distance_m}m
                </span>
              </Button>
            ))}
          </div>
          <RetryButton label={labels.retry} onClick={reset} />
        </div>
      ) : null}

      {view.name === "notFound" || view.name === "error" ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <StoreIcon className="text-muted-foreground size-12" />
          <p className="text-lg">
            {view.name === "notFound" ? labels.notFound : labels.error}
          </p>
          <RetryButton label={labels.retry} onClick={reset} />
        </div>
      ) : null}
    </main>
  );
}

function RetryButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button className="h-12 w-full text-base" onClick={onClick} size="lg">
      <RotateCcwIcon />
      {label}
    </Button>
  );
}

function LocationStatus({
  status,
  location,
  labels,
  areaLabel,
  onChooseArea,
}: {
  status: "locating" | "ok" | "denied";
  location: Location | null;
  labels: Labels;
  areaLabel: Record<Area, string>;
  onChooseArea: (area: Area) => void;
}) {
  if (status === "locating") {
    return (
      <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        <LoaderCircleIcon className="size-4 animate-spin" />
        {labels.locating}
      </p>
    );
  }

  if (status === "ok" && location) {
    return (
      <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
        <MapPinIcon className="size-4" />
        GPS ±{Math.round(location.accuracy)}m
      </p>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border p-4">
      <p className="text-sm leading-6">{labels.locationDenied}</p>
      <p className="font-semibold">{labels.chooseArea}</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(AREAS) as Area[]).map((area) => (
          <Button
            aria-pressed={location?.area === area}
            className={cn(
              "h-auto min-h-11 px-2 py-2 text-sm whitespace-normal",
              location?.area === area && "ring-primary ring-2",
            )}
            key={area}
            onClick={() => onChooseArea(area)}
            variant={location?.area === area ? "default" : "outline"}
          >
            {areaLabel[area]}
          </Button>
        ))}
      </div>
      {location?.area ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <MapPinIcon className="size-4" />
          {areaLabel[location.area]}
        </p>
      ) : null}
    </section>
  );
}
