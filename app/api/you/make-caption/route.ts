import { NextResponse } from "next/server";
import {
  localOnBrandCaption,
  type MakeCaptionInput,
} from "@/lib/you/make-caption";

export const runtime = "nodejs";

const SYSTEM_PROMPT = [
  "You write social captions for Tethered & Truth.",
  "Voice: dark luxury, honest, short. No hype, no emojis, no hashtag spam.",
  "The user's one-line intent is a brief only — it is NOT the caption.",
  "Rewrite it into a finished caption in brand voice.",
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

  const userParts = [
    `Brand: ${input.brandName}`,
    input.voiceLabel ? `Voice label: ${input.voiceLabel}` : "",
    input.voiceTone?.length ? `Voice tone: ${input.voiceTone.join(", ")}` : "",
    input.moodTags?.length ? `Mood: ${input.moodTags.join(", ")}` : "",
    `Intent (brief only, do not paste): ${input.oneLiner}`,
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
    const caption = String(raw).trim().replace(/^["']|["']$/g, "");
    if (!caption) {
      return localResponse(input);
    }

    return NextResponse.json({ caption, source: "ai" as const });
  } catch {
    return localResponse(input);
  }
}
