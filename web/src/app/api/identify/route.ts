import OpenAI from "openai";

import { createAdminClient } from "@/lib/supabase/admin";

import {
  type ScanLang,
  type StoreCard,
  scanLangs,
} from "@/features/scan/types";

// POST /api/identify — 간판 사진 + GPS → 주변 후보 중 어느 가게인지 (로그인 불필요)
// 사진은 저장하지 않는다. OpenAI로 보내고 응답 후 버린다.

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = process.env.OPENAI_VISION_MODEL ?? "gpt-5.4-mini";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// gps: 실제 위치 기준 좁은 반경 / area: 사용자가 고른 지역 중심 기준 넓은 반경
const GPS_MIN_RADIUS_M = 60;
const GPS_MAX_RADIUS_M = 300;
const GPS_MAX_COUNT = 15;
const AREA_RADIUS_M = 800;
const AREA_MAX_COUNT = 40;
type Mode = "gps" | "area";

type Candidate = {
  id: number;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  info: unknown;
  is_curated: boolean;
};

type Choice = {
  sign_text: string;
  store_id: string;
  confidence: number;
  top3: string[];
};

const SYSTEM = `You identify which shop a tourist photographed in Seoul (Seochon/Bukchon).
Read the text on the sign, storefront, menu board or window (Korean, English, or other) in the photo.
Then choose the matching shop ONLY from the given candidate list (ids). Never pick a shop that is not in the list.
- If the sign text clearly matches a candidate's name (Korean or English), pick it with high confidence.
- If you are unsure, still pick the most likely candidate but give a low confidence (below 0.5).
- If the photo does not match any candidate, or no sign is readable, answer store_id "none".
- confidence is a number from 0 to 1.
- sign_text: the main text you read on the sign, as written (empty string if none).
- top3: up to 3 candidate ids that are most likely, best first (empty if nothing fits).`;

let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    openai = new OpenAI({ apiKey, maxRetries: 1, timeout: 25_000 });
  }
  return openai;
}

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function toCard(c: Candidate, lang: ScanLang): StoreCard {
  const info = (c.info ?? {}) as Record<string, unknown>;
  return {
    id: c.id,
    name_ko: c.name_ko,
    name_en: c.name_en,
    category: c.category,
    lat: c.lat,
    lng: c.lng,
    distance_m: Math.round(c.distance_m),
    vegan: (info.vegan as StoreCard["vegan"]) ?? null,
    price_level: (info.price_level as string) ?? null,
    detail: (info[lang] as StoreCard["detail"]) ?? null,
  };
}

async function findCandidates(
  lat: number,
  lng: number,
  radius: number,
  maxCount: number,
) {
  // max_count는 기본값(15)과 다를 때만 보냄 → nearby_stores v1(3인자)에서도 gps 모드는 동작
  const { data, error } = await createAdminClient().rpc("nearby_stores", {
    lat,
    lng,
    radius_m: radius,
    ...(maxCount !== GPS_MAX_COUNT ? { max_count: maxCount } : {}),
  });
  if (error) throw new Error(`nearby_stores failed: ${error.message}`);
  return (data ?? []) as Candidate[];
}

// 로그 실패는 응답에 영향 주지 않음 (콘솔에만 기록)
async function writeLog(row: {
  lat: number;
  lng: number;
  accuracy: number | null;
  sign_text: string;
  store_id: number | null;
  confidence: number;
  lang: ScanLang;
}): Promise<number | null> {
  try {
    const { data, error } = await createAdminClient()
      .from("scan_logs")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  } catch (caught) {
    console.error("[api/identify] scan_logs insert failed", caught);
    return null;
  }
}

async function chooseStore(imageBase64: string, candidates: Candidate[]) {
  const ids = candidates.map((c) => String(c.id));
  const list = candidates
    .map((c) =>
      // 후보가 최대 40개라 짧게: id, 이름, 업종만
      JSON.stringify({
        id: String(c.id),
        name_ko: c.name_ko,
        name_en: c.name_en,
        category: c.category,
      }),
    )
    .join("\n");

  const res = await getOpenAI().chat.completions.create({
    model: MODEL,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: [
          { type: "text", text: `Candidates:\n${list}` },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "store_choice",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sign_text: { type: "string" },
            store_id: { type: "string", enum: [...ids, "none"] },
            confidence: { type: "number" },
            top3: { type: "array", items: { type: "string", enum: ids } },
          },
          required: ["sign_text", "store_id", "confidence", "top3"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = res.choices[0]?.message.content;
  if (!content) throw new Error("empty model response");
  return JSON.parse(content) as Choice;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (
    body.lat == null ||
    body.lng == null ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return json({ error: "lat and lng are required" }, 400);
  }

  const image =
    typeof body.image === "string"
      ? body.image.replace(/^data:image\/[a-z+.-]+;base64,/i, "")
      : "";
  if (!image) return json({ error: "image is required" }, 400);
  if (Math.floor((image.length * 3) / 4) > MAX_IMAGE_BYTES) {
    return json({ error: "Image is too large (max 4MB)" }, 413);
  }

  const lang: ScanLang = scanLangs.includes(body.lang as ScanLang)
    ? (body.lang as ScanLang)
    : "en";
  const mode: Mode = body.mode === "area" ? "area" : "gps";
  const accuracy = Number(body.accuracy);
  const hasAccuracy = body.accuracy != null && Number.isFinite(accuracy);
  const maxCount = mode === "area" ? AREA_MAX_COUNT : GPS_MAX_COUNT;
  let radius =
    mode === "area"
      ? AREA_RADIUS_M
      : Math.min(
          GPS_MAX_RADIUS_M,
          Math.max(
            GPS_MIN_RADIUS_M,
            hasAccuracy ? accuracy * 1.5 : GPS_MIN_RADIUS_M,
          ),
        );

  try {
    let candidates = await findCandidates(lat, lng, radius, maxCount);
    if (
      candidates.length === 0 &&
      mode === "gps" &&
      radius < GPS_MAX_RADIUS_M
    ) {
      radius = GPS_MAX_RADIUS_M;
      candidates = await findCandidates(lat, lng, radius, maxCount);
    }

    const radius_used = Math.round(radius);
    const logBase = {
      lat,
      lng,
      accuracy: hasAccuracy ? accuracy : null,
      lang,
    };

    if (candidates.length === 0) {
      const log_id = await writeLog({
        ...logBase,
        sign_text: "",
        store_id: null,
        confidence: 0,
      });
      return json({
        log_id,
        sign_text: "",
        confidence: 0,
        mode,
        radius_used,
        candidates: 0,
        store: null,
        alternatives: [],
      });
    }

    const choice = await chooseStore(image, candidates);
    const byId = new Map(candidates.map((c) => [String(c.id), c]));
    const picked =
      choice.store_id === "none" ? undefined : byId.get(choice.store_id);
    const confidence = Math.min(1, Math.max(0, choice.confidence));

    const alternatives = [...new Set(choice.top3)]
      .slice(0, 3)
      .map((id) => byId.get(id))
      .filter((c): c is Candidate => Boolean(c))
      .map((c) => toCard(c, lang));

    const log_id = await writeLog({
      ...logBase,
      sign_text: choice.sign_text,
      store_id: picked?.id ?? null,
      confidence,
    });

    return json({
      log_id,
      sign_text: choice.sign_text,
      confidence,
      mode,
      radius_used,
      candidates: candidates.length,
      store: picked ? toCard(picked, lang) : null,
      alternatives,
    });
  } catch (caught) {
    console.error("[api/identify]", caught);
    return json(
      { error: "Could not identify the store. Please try again." },
      502,
    );
  }
}
