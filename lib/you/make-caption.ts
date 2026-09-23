/**
 * Local on-brand caption from locked kit voice.
 * Used when no Grok/API key is available - never claims the post was published.
 */
export type MakeCaptionInput = {
  brandName: string;
  oneLiner: string;
  voiceLabel?: string;
  voiceTone?: string[];
  moodTags?: string[];
};

export function localOnBrandCaption(input: MakeCaptionInput): string {
  const brand = input.brandName.trim() || "your brand";
  const line = input.oneLiner.trim().replace(/\s+/g, " ");
  const tones = (input.voiceTone || []).map((t) => t.trim()).filter(Boolean);
  const moods = (input.moodTags || []).map((t) => t.trim()).filter(Boolean);
  const voice =
    tones.slice(0, 3).join(", ") ||
    (input.voiceLabel || "").trim() ||
    moods.slice(0, 3).join(", ") ||
    "honest";

  if (!line) {
    return `Something true from ${brand}.\n\n- ${brand} - ${voice}`;
  }

  // Keep the user's sentence first; kit voice as a quiet signature.
  return `${line}\n\n- ${brand}\n(${voice})`;
}
