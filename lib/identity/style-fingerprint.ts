/**
 * Style uniqueness seam (DR-2026-09-13-007).
 * Exact twins are forbidden across distinct people/brands.
 * Same-company campaign kits may share a fingerprint on purpose.
 */

export type StyleFingerprintInput = {
  contentStyle: string;
  /** Stable ids or hashes of the three reference photos. */
  referencePhotoKeys: string[];
  socialSites: string[];
  /** Optional palette / type cues when present. */
  energyStrikeId?: string;
};

export type StyleFingerprint = string;

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Deterministic fingerprint for "is this the same style package?" checks. */
export function buildStyleFingerprint(
  input: StyleFingerprintInput,
): StyleFingerprint {
  const parts = [
    normalize(input.contentStyle),
    ...input.referencePhotoKeys.map((k) => k.trim()),
    [...input.socialSites].map(normalize).sort().join(","),
    input.energyStrikeId ? normalize(input.energyStrikeId) : "",
  ];
  return parts.join("|");
}

/**
 * True when two packages are exact twins.
 * Callers must still decide same-company campaign exception.
 */
export function isExactStyleTwin(a: StyleFingerprint, b: StyleFingerprint): boolean {
  return a.length > 0 && a === b;
}