/**
 * Make this captions: AI preferred; local rewrite only as fallback.
 * Never echo the intent line as the caption.
 */

export type MakeCaptionInput = {
  brandName: string;
  oneLiner: string;
  voiceLabel?: string;
  voiceTone?: string[];
  moodTags?: string[];
};

export type MakeCaptionResult = {
  caption: string;
  source: "ai" | "local";
};

/**
 * Local rewrite of the brief into a short on-brand caption.
 * Must not return `${line}\n\n- brand` or otherwise paste the intent.
 */
export function localOnBrandCaption(input: MakeCaptionInput): string {
  const brand = input.brandName.trim() || "your brand";
  const brief = input.oneLiner.trim().replace(/\s+/g, " ");
  const tones = (input.voiceTone || []).map((t) => t.trim()).filter(Boolean);
  const moods = (input.moodTags || []).map((t) => t.trim()).filter(Boolean);
  const voiceBits = [
    ...tones.slice(0, 2),
    ...moods.slice(0, 2),
    (input.voiceLabel || "").trim(),
  ].filter(Boolean);
  const voice = voiceBits.slice(0, 3).join(", ") || "honest";

  if (!brief) {
    return `Quiet truth, held carefully.\n\n${brand}`;
  }

  // Rewrite the brief — do not paste it. Keep dark-luxury / honest / short.
  const lower = brief.toLowerCase();
  let body: string;

  if (/\b(launch|drop|release|out now|new)\b/.test(lower)) {
    body = "Something new, said without noise.";
  } else if (/\b(thank|grateful|gratitude)\b/.test(lower)) {
    body = "Grateful, quietly.";
  } else if (/\b(behind|process|making|studio|work)\b/.test(lower)) {
    body = "The work, before the polish.";
  } else if (/\b(look|photo|mirror|face|self)\b/.test(lower)) {
    body = "This is the look. Nothing extra.";
  } else if (/\b(song|music|track|listen)\b/.test(lower)) {
    body = "Sound first. Words after.";
  } else if (brief.length <= 40) {
    body = "Said once. Meant.";
  } else {
    body = "Held close. Told straight.";
  }

  // Soft touch of voice without dumping tags as marketing copy.
  if (/honest|quiet|dark|luxury|soft|true/.test(voice.toLowerCase())) {
    return `${body}\n\n${brand}`;
  }
  return `${body}\n\n${brand}`;
}

/** Client: POST /api/you/make-caption; fall back to local only if the API fails. */
export async function requestAiCaption(
  input: MakeCaptionInput,
): Promise<MakeCaptionResult> {
  try {
    const res = await fetch("/api/you/make-caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: input.brandName,
        oneLiner: input.oneLiner,
        voiceLabel: input.voiceLabel,
        voiceTone: input.voiceTone,
        moodTags: input.moodTags,
      }),
    });
    if (!res.ok) {
      return {
        caption: localOnBrandCaption(input),
        source: "local",
      };
    }
    const data = (await res.json()) as {
      caption?: unknown;
      source?: unknown;
    };
    const caption =
      typeof data.caption === "string" ? data.caption.trim() : "";
    if (!caption) {
      return {
        caption: localOnBrandCaption(input),
        source: "local",
      };
    }
    const source = data.source === "ai" ? "ai" : "local";
    return { caption, source };
  } catch {
    return {
      caption: localOnBrandCaption(input),
      source: "local",
    };
  }
}
