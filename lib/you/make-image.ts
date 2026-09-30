/**
 * Client helpers for Make this visual orders: downscale the Look photo so the
 * request stays well under Vercel's ~4.5MB body limit, then ask
 * /api/you/make-image for a real edit of that photo.
 */
import type { PaletteSwatch } from "@/lib/you/make-order";
import type { BrandMaster } from "@/lib/brand/brand-masters";

export const IMAGE_NOT_CONNECTED_MESSAGE =
  "Image edit isn't connected yet \u2014 nothing was changed.";

/** Keep the JSON body well under Vercel's ~4.5MB request limit. */
const MAX_UPLOAD_CHARS = 3_500_000;

export type ImageEditResult =
  | { ok: true; image: string; kind: "edit"; model: string }
  | { ok: false; message: string };

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/** Re-encode as JPEG, shrinking until the data URL fits MAX_UPLOAD_CHARS. */
export async function downscaleImageForUpload(src: string): Promise<string> {
  const img = await loadImage(src);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new Error("empty image");
  let side = 1536;
  let quality = 0.88;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const scale = Math.min(1, side / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#0c0c0d";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length <= MAX_UPLOAD_CHARS) return out;
    side = Math.round(side * 0.75);
    quality = Math.max(0.6, quality - 0.08);
  }
  throw new Error("too large");
}

export async function requestImageEdit(input: {
  order: string;
  photoSrc: string;
  brandName: string;
  palette: PaletteSwatch[];
  /** Applied Brand 1 / 2 / 3 master; the server uses only this. */
  brand?: BrandMaster;
}): Promise<ImageEditResult> {
  let imageDataUrl: string;
  try {
    imageDataUrl = await downscaleImageForUpload(input.photoSrc);
  } catch {
    return {
      ok: false,
      message:
        "That photo could not be prepared for the image edit \u2014 nothing was changed.",
    };
  }
  try {
    const res = await fetch("/api/you/make-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: input.order,
        imageDataUrl,
        brandName: input.brandName,
        palette: input.palette,
        brand: input.brand,
      }),
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: unknown;
      image?: unknown;
      model?: unknown;
      reason?: unknown;
    } | null;
    if (
      res.ok &&
      data?.ok === true &&
      typeof data.image === "string" &&
      data.image.startsWith("data:image/")
    ) {
      return {
        ok: true,
        image: data.image,
        kind: "edit",
        model: typeof data.model === "string" ? data.model : "",
      };
    }
    if (data?.reason === "image_too_large") {
      return {
        ok: false,
        message:
          "That photo is too large to send \u2014 nothing was changed. Try a smaller photo.",
      };
    }
    return { ok: false, message: IMAGE_NOT_CONNECTED_MESSAGE };
  } catch {
    return { ok: false, message: IMAGE_NOT_CONNECTED_MESSAGE };
  }
}

/** File name for Download, from the data URL mime type. */
export function downloadNameForImage(dataUrl: string): string {
  const m = dataUrl.match(/^data:image\/(png|jpe?g|webp)/i);
  const ext = m ? m[1].toLowerCase().replace("jpeg", "jpg") : "png";
  return `brandforged-make-this.${ext}`;
}
