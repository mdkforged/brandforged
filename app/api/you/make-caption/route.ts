import { NextResponse } from "next/server";
import {
  briefAsksForPhotoCaption,
  enforceFourHashtags,
  extractReleaseTitle,
  localOnBrandCaption,
  type MakeCaptionInput,
} from "@/lib/you/make-caption";

export const runtime = "nodejs";

const SYSTEM_PROMPT = [
  "Artist: Tethered & Truth by MDK.",
  "Voice: inspiring, empathetic, powerful. Dark luxury without hype.",
  "Length: medium, 3-6 short sentences. Specific. Human.",
  "The user's one-line brief is the job: it names the subject of the post. Write about that subject.",
  "The brief is intent only - never paste, quote, or restate it as the caption.",
  "If the brief names a song, album, single, EP, or release (for example 'Album art - Moment To Rise'), write about that release: what it feels like, what it is about, why it matters to the listener. Use the release title naturally.",
  "Do NOT describe the photo or image. You cannot see it. Never write 'the frame captures', and never list flowers, lighting, colors, outfits, poses, or scenery. Words like album art, cover, or look in the brief say what the image is for, not what to write about.",
  "Only speak to the image itself if the brief explicitly asks for a caption for this photo or to describe the photo / the look, and even then stay with what the brief says.",
  "Never use: now available, listen where you like, out now, emoji dumps, hashtag walls, slay, or corporate launch-speak.",
  "End the caption with exactly 4 popular, relevant hashtags on their own last line (example shape: #NewMusic #TetheredAndTruth #IndependentArtist #NowPlaying). Not 3, not 5, not a dump.",
  "Return caption text only. No quotes, no labels, no preamble.",
].join(" ");

type Body = {
  brandName?: unknown;
  oneLiner?: unknown;
  voiceLabel?: unknown;
  voiceTone?: unknown;
  moodTags?: unknown;
};

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
  return out.length ? out : undefined;
}

function localResponse(input: MakeCaptionInput) {
  return NextResponse.json({
    caption: localOnBrandCaption(input),
    source: "local" as const,
  });
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  const input: MakeCaptionInput = {
    brandName: asString(body.brandName) || "Tethered & Truth",
    oneLiner: asString(body.oneLiner),
    voiceLabel: asString(body.voiceLabel) || undefined,
    voiceTone: asStringArray(body.voiceTone),
    moodTags: asStringArray(body.moodTags),
  };

  const apiKey =
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim() || "";

  if (!apiKey || !input.oneLiner) {
    return localResponse(input);
  }

  // The Look photo is never sent to the model: the brief is the subject.
  const releaseTitle = extractReleaseTitle(input.oneLiner);
  const photoRequested = briefAsksForPhotoCaption(input.oneLiner);
  const userParts = [
    `SUBJECT OF THE POST (write about this; do not paste or restate it): ${input.oneLiner}`,
    releaseTitle
      ? `Release named in the brief: "${releaseTitle}" - write about this release.`
      : "",
    photoRequested
      ? "The brief asks for a photo caption. Keep to what the brief says about the look; do not invent image details."
      : "Photo: not provided and not the subject. Do not describe any image.",
    `Brand: ${input.brandName}`,
    input.voiceLabel ? `Voice label: ${input.voiceLabel}` : "",
    input.voiceTone?.length ? `Voice tone: ${input.voiceTone.join(", ")}` : "",
    input.moodTags?.length
      ? `Mood (tone only, not image content): ${input.moodTags.join(", ")}`
      : "",
  ].filter(Boolean);

  try {
    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-4",
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userParts.join("\n") },
        ],
      }),
    });

    if (!upstream.ok) {
      return localResponse(input);
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = String(raw).trim().replace(/^["']|["']$/g, "");
    if (!cleaned.replace(/#[A-Za-z0-9_]+/g, "").trim()) {
      return localResponse(input);
    }
    const caption = enforceFourHashtags(cleaned);

    return NextResponse.json({ caption, source: "ai" as const });
  } catch {
    return localResponse(input);
  }
}
