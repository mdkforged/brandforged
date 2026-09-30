import { NextResponse } from "next/server";
import {
  isTetheredTruthBrand,
  TETHERED_TRUTH_SWATCHES,
} from "@/lib/brand/tethered-truth-palette";
import {
  buildImageEditPrompt,
  type PaletteSwatch,
} from "@/lib/you/make-order";

export const runtime = "nodejs";
export const maxDuration = 60;

/** xAI Imagine image edit: takes the selected Look photo as the input image. */
const EDIT_URL = "https://api.x.ai/v1/images/edits";
const EDIT_MODELS = ["grok-imagine-image-2.0", "grok-imagine-image"] as const;
const MAX_IMAGE_CHARS = 4_200_000;

type Body = {
  order?: unknown;
  imageDataUrl?: unknown;
  brandName?: unknown;
  palette?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function parsePalette(v: unknown): PaletteSwatch[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      const o = (item || {}) as { name?: unknown; hex?: unknown };
      const hex = asString(o.hex);
      const name = asString(o.name).slice(0, 40);
      return /^#[0-9a-f]{6}$/i.test(hex) && name ? { name, hex } : null;
    })
    .filter((x): x is PaletteSwatch => Boolean(x))
    .slice(0, 8);
}

function fail(status: number, reason: string) {
  return NextResponse.json({ ok: false as const, reason }, { status });
}

function sniffMime(b64: string): string {
  if (b64.startsWith("/9j/")) return "image/jpeg";
  if (b64.startsWith("iVBOR")) return "image/png";
  if (b64.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    return fail(400, "bad_request");
  }

  const order = asString(body.order).slice(0, 400);
  const image = asString(body.imageDataUrl);
  if (!order) return fail(400, "no_order");
  if (!/^data:image\/(png|jpe?g|webp);base64,/i.test(image)) {
    return fail(400, "bad_image");
  }
  if (image.length > MAX_IMAGE_CHARS) return fail(413, "image_too_large");

  const apiKey =
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim() || "";
  if (!apiKey) return fail(503, "not_connected");

  const brandName = asString(body.brandName).slice(0, 80);
  // Tethered & Truth always uses the locked Master Palette.
  const palette: PaletteSwatch[] = isTetheredTruthBrand(brandName)
    ? TETHERED_TRUTH_SWATCHES.map((s) => ({ name: s.name, hex: s.hex }))
    : parsePalette(body.palette);
  const prompt = buildImageEditPrompt({ order, brandName, palette });

  for (const model of EDIT_MODELS) {
    let res: Response;
    try {
      res = await fetch(EDIT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          prompt,
          image: { url: image, type: "image_url" },
          n: 1,
          response_format: "b64_json",
        }),
        signal: AbortSignal.timeout(55_000),
      });
    } catch (err) {
      console.error("make-image: xAI edit request failed", model, err);
      return fail(502, "upstream_error");
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("make-image: xAI edit error", model, res.status, text.slice(0, 300));
      // Try the next model name only when this one is not recognized.
      if ((res.status === 400 || res.status === 404) && /model/i.test(text)) continue;
      return fail(502, "upstream_error");
    }

    const data = (await res.json().catch(() => null)) as {
      data?: Array<{
        b64_json?: string | null;
        url?: string | null;
        mime_type?: string | null;
      }>;
    } | null;
    const first = data?.data?.[0];
    let b64 = first?.b64_json || "";
    let mime = first?.mime_type || "";
    if (!b64 && first?.url) {
      try {
        const imgRes = await fetch(first.url, { signal: AbortSignal.timeout(20_000) });
        if (imgRes.ok) {
          b64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
          mime = imgRes.headers.get("content-type") || "";
        }
      } catch {
        b64 = "";
      }
    }
    if (!b64) return fail(502, "no_image");
    if (!mime.startsWith("image/")) mime = sniffMime(b64);

    return NextResponse.json({
      ok: true as const,
      image: `data:${mime};base64,${b64}`,
      kind: "edit" as const,
      model,
    });
  }

  return fail(502, "upstream_error");
}
