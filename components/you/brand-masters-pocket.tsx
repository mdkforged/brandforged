"use client";

import { useState } from "react";
import {
  BRAND_HEX_FIELDS,
  BRAND_NAME_MAX,
  BRAND_RULE_MAX,
  BRAND_SLOTS,
  draftFromMaster,
  isValidHex,
  saveBrandMasters,
  validateBrandDraft,
  type BrandDraft,
  type BrandHexKey,
  type BrandMasters,
  type BrandSlot,
} from "@/lib/brand/brand-masters";

type PocketProps = {
  masters: BrandMasters;
  slot: BrandSlot;
  onSlotChange: (slot: BrandSlot) => void;
  onSaved: (next: BrandMasters) => void;
};

/** Brand masters pocket: name, four locked hexes, optional rule per brand. */
export function BrandMastersPocket({
  masters,
  slot,
  onSlotChange,
  onSaved,
}: PocketProps) {
  return (
    <section className="brand-pocket" aria-label="Brand masters">
      <div className="brand-pocket-head">
        <p className="make-this-result-label">Brand masters</p>
        <p className="make-this-hint">
          Each brand keeps its own locked colors and rule. Make this uses only
          the brand you apply. Saved on this device.
        </p>
        <div className="brand-pocket-tabs" role="tablist" aria-label="Brand">
          {BRAND_SLOTS.map((s) => (
            <button
              key={`pocket-tab-${s}`}
              type="button"
              role="tab"
              aria-selected={s === slot}
              className={s === slot ? "brand-pocket-tab is-on" : "brand-pocket-tab"}
              onClick={() => onSlotChange(s)}
            >
              Brand {s}
              {masters[s] ? "" : " (empty)"}
            </button>
          ))}
        </div>
      </div>
      {/* key remounts the form so its draft starts from the saved master. */}
      <BrandMasterForm key={`pocket-form-${slot}`} slot={slot} masters={masters} onSaved={onSaved} />
    </section>
  );
}

type FormProps = {
  slot: BrandSlot;
  masters: BrandMasters;
  onSaved: (next: BrandMasters) => void;
};

function BrandMasterForm({ slot, masters, onSaved }: FormProps) {
  const saved = masters[slot];
  const [draft, setDraft] = useState<BrandDraft>(() => draftFromMaster(saved));
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  function update(key: keyof BrandDraft, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setError(null);
    setStatus(null);
  }

  // Brand 1 is refined, never emptied: invalid edits revert on blur.
  function onNameBlur() {
    if (slot === 1 && saved && !draft.name.trim()) {
      setDraft((d) => ({ ...d, name: saved.name }));
      setError("Brand 1 can't be emptied - its name was put back.");
    }
  }

  function onHexBlur(key: BrandHexKey, label: string) {
    if (slot === 1 && saved && !isValidHex(draft[key])) {
      setDraft((d) => ({ ...d, [key]: saved[key] }));
      setError(`${label} must be #RRGGBB - Brand 1 kept its saved color.`);
    }
  }

  function persist(next: BrandMasters, message: string): boolean {
    if (!saveBrandMasters(next)) {
      setError("Could not save on this device. Try again.");
      return false;
    }
    setStatus(message);
    onSaved(next);
    return true;
  }

  function onSave() {
    const res = validateBrandDraft(draft, slot);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    const next = { ...masters, [slot]: res.master } as BrandMasters;
    if (persist(next, `Saved Brand ${slot} on this device.`)) {
      setDraft(draftFromMaster(res.master));
    }
  }

  function onClear() {
    if (slot === 1) return;
    const next = { ...masters, [slot]: null } as BrandMasters;
    if (persist(next, `Brand ${slot} cleared.`)) {
      setDraft(draftFromMaster(null));
    }
  }

  function onRevert() {
    setDraft(draftFromMaster(saved));
    setError(null);
    setStatus(null);
  }

  return (
    <div className="brand-pocket-form">
      <label className="brand-pocket-field">
        <span>Brand {slot} name</span>
        <input
          type="text"
          value={draft.name}
          maxLength={BRAND_NAME_MAX}
          placeholder={slot === 1 ? "Tethered & Truth by MDK" : "Brand name"}
          onChange={(e) => update("name", e.target.value)}
          onBlur={onNameBlur}
        />
      </label>

      <div className="brand-pocket-hexes">
        {BRAND_HEX_FIELDS.map((field) => {
          const value = draft[field.key];
          return (
            <div className="brand-pocket-hex" key={`hex-${slot}-${field.key}`}>
              <span>{field.label}</span>
              <input
                type="color"
                aria-label={`${field.label} color picker`}
                value={isValidHex(value) ? value.trim().toLowerCase() : "#000000"}
                onChange={(e) => update(field.key, e.target.value)}
              />
              <input
                type="text"
                aria-label={`${field.label} hex`}
                value={value}
                maxLength={7}
                placeholder="#RRGGBB"
                spellCheck={false}
                autoCapitalize="off"
                onChange={(e) => update(field.key, e.target.value.trim())}
                onBlur={() => onHexBlur(field.key, field.label)}
              />
            </div>
          );
        })}
      </div>

      <label className="brand-pocket-field">
        <span>Rule (optional, one line)</span>
        <input
          type="text"
          value={draft.rule}
          maxLength={BRAND_RULE_MAX}
          placeholder="e.g. gold type only, no neon, no extra logo"
          onChange={(e) => update("rule", e.target.value)}
        />
      </label>

      <div className="brand-pocket-actions">
        <button type="button" className="new-button" onClick={onSave}>
          Save Brand {slot}
        </button>
        <button type="button" className="new-button" onClick={onRevert}>
          Revert
        </button>
        {slot !== 1 && saved ? (
          <button type="button" className="new-button" onClick={onClear}>
            Clear Brand {slot}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="locked-you-error" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="brand-pocket-status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </div>
  );
}
