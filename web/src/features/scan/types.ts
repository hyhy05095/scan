// /api/identify 응답 타입 (서버·클라이언트 공용)

export const scanLangs = ["en", "zh", "ja", "ru", "es"] as const;
export type ScanLang = (typeof scanLangs)[number];

export type VeganLevel = "likely" | "check" | "hard";

export type StoreDetail = {
  cuisine: string;
  signature_menu: string[];
  vegan_note: string;
  review_summary: string[];
  tip: string;
};

export type StoreCard = {
  id: number;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  vegan: VeganLevel | null;
  price_level: string | null;
  detail: StoreDetail | null;
};

export type IdentifyResponse = {
  log_id: number | null;
  sign_text: string;
  confidence: number;
  mode: "gps" | "area";
  radius_used: number;
  candidates: number;
  store: StoreCard | null;
  alternatives: StoreCard[];
};
