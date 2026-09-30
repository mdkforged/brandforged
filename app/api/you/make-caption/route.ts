import { NextResponse } from "next/server";
import {
  briefAsksForPhotoCaption,
  enforceFourHashtags,
  extractReleaseTitle,
  hashtagsForBrand,
  localOnBrandCaption,
  notesMatchRelease,
  stripMetaText,
  type MakeCaptionInput,
} from "@/lib/you/make-caption";
import { classifyBrief, extractOrderQuote } from "@/lib/you/make-order";
import { parseBrandMaster } from "@/lib/brand/brand-masters";

export const runtime = "nodejs";

/** Server-side cap on Notes text (client already trims to ~4000). */
const NOTES_SERVER_MAX = 6000;

function buildSystemPrompt(artist: string, tagShape: string): string {
  return [
  `Artist: ${artist}.`,
  "Voice: inspiring, empathetic, powerful. Dark luxury without hype.",
  "Length: medium, 3-6 short sentences. Specific. Human.",
  "The user's one-line brief is the job: it names the subject of the post. Write about that subject.",
  "The brief is intent only - never paste, quote, or restate it as the caption.",
  "If the brief names a song, album, single, EP, or release (for example 'Album art - Moment To Rise'), write about that release: what it feels like, what it is about, why it matters to the listener. Use the release title naturally.",
  "Do NOT describe the photo or image. You cannot see it. Never write 'the frame captures', and never list flowers, lighting, colors, outfits, poses, or scenery. Words like album art, cover, or look in the brief say what the image is for, not what to write about.",
  "Only speak to the image itself if the brief explicitly asks for a caption for this photo or to describe the photo / the look, and even then stay with what the brief says.",
  "Never use: now available, listen where you like, out now, emoji dumps, hashtag walls, slay, or corporate launch-speak.",
  "When NOTES are provided and they name the same release as the brief, the notes ARE the meaning of the caption: carry their substance and emotional truth (who it is dedicated to, prayer, the body fighting back, faith, why it was worth it to try), paraphrased in her voice. Never paste the notes verbatim or quote them at length. If the notes are about something else, ignore them.",
  "Write one finished caption, ready to post. Never tell her to go somewhere else to rewrite or finish it, never offer options, and never add meta text like 'you may want to edit this' or 'feel free to adjust'.",
  `End the caption with exactly 4 popular, relevant hashtags on their own last line (example shape: ${tagShape}). Not 3, not 5, not a dump.`,
  "Return caption text only. No quotes, no labels, no preamble.",
].join(" ");
}

type Body = {
  brandName?: unknown;
  oneLiner?: unknown;
  voiceLabel?: unknown;
  voiceTone?: unknown;
  moodTags?: unknown;
  notes?: unknown;
  brand?: unknown;
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

  // Applied Brand 1 / 2 / 3 master: its name is voice context only.
  const master = parseBrandMaster(body.brand);
  const input: MakeCaptionInput = {
    brandName: master?.name || asString(body.brandName) || "Tethered & Truth",
    brand: master || undefined,
    oneLiner: asString(body.oneLiner),
    voiceLabel: asString(body.voiceLabel) || undefined,
    voiceTone: asStringArray(body.voiceTone),
    moodTags: asStringArray(body.moodTags),
    notes: asString(body.notes).slice(0, NOTES_SERVER_MAX) || undefined,
  };

  const apiKey =
    process.env.XAI_API_KEY?.trim() || process.env.GROK_API_KEY?.trim() || "";

  if (!apiKey || !input.oneLiner) {
    return localResponse(input);
  }

  // The Look photo is never sent to the model: the brief is the subject.
  const releaseTitle = extractReleaseTitle(input.oneLiner);
  const photoRequested = briefAsksForPhotoCaption(input.oneLiner);
  const isVisualOrder = classifyBrief(input.oneLiner) === "visual";
  const orderQuote = isVisualOrder ? extractOrderQuote(input.oneLiner) : null;
  const notes = input.notes || "";
  const artist = input.brand ? input.brand.name : "Tethered & Truth by MDK";
  const brandTags = hashtagsForBrand(input.brandName);
  const notesOnRelease = Boolean(
    releaseTitle && notes && notesMatchRelease(notes, releaseTitle),
  );
  const userParts = [
    `SUBJECT OF THE POST (write about this; do not paste or restate it): ${input.oneLiner}`,
    releaseTitle && releaseTitle !== orderQuote
      ? `Release named in the brief: "${releaseTitle}" - write about this release.`
      : "",
    photoRequested
      ? "The brief asks for a photo caption. Keep to what the brief says about the look; do not invent image details."
      : "Photo: not provided and not the subject. Do not describe any image.",
    isVisualOrder
      ? "The brief is an image order (it changes the picture). The caption goes with the finished piece: write about the subject or release it names, not about the edit, the design, or the photo."
      : "",
    orderQuote
      ? `Quote on the piece: "${orderQuote}" - speak to its meaning; do not repeat it word for word.`
      : "",
    `Brand: ${input.brandName}`,
    input.brand?.rule
      ? `Brand rule (follow it where it applies to words): ${input.brand.rule}`
      : "",
    input.voiceLabel ? `Voice label: ${input.voiceLabel}` : "",
    input.voiceTone?.length ? `Voice tone: ${input.voiceTone.join(", ")}` : "",
    input.moodTags?.length
      ? `Mood (tone only, not image content): ${input.moodTags.join(", ")}`
      : "",
    notesOnRelease
      ? `NOTES - her own words about "${releaseTitle}". These notes ARE the meaning of this caption. Carry their substance and emotional truth, paraphrased; do not paste or quote them:\n${notes}`
      : notes
        ? `NOTES (her private notes; use them only where they speak to the subject of the post; paraphrase, never paste):\n${notes}`
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
          { role: "system", content: buildSystemPrompt(artist, brandTags.join(" ")) },
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
    const cleaned = stripMetaText(
      String(raw).trim().replace(/^["']|["']$/g, ""),
    );
    if (!cleaned.replace(/#[A-Za-z0-9_]+/g, "").trim()) {
      return localResponse(input);
    }
    const caption = enforceFourHashtags(cleaned, brandTags);

    return NextResponse.json({ caption, source: "ai" as const });
  } catch {
    return localResponse(input);
  }
}
