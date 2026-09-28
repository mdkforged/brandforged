"use client";

import Link from "next/link";
import { useState } from "react";

const NOTES_KEY = "bf-you-notes-v1";

function loadNotes(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NOTES_KEY) || "";
  } catch {
    return "";
  }
}

export default function YouNotesPage() {
  const [notes, setNotes] = useState(loadNotes);
  const ready = true;
  const [saved, setSaved] = useState(false);

  function persist(value: string) {
    setNotes(value);
    try {
      window.localStorage.setItem(NOTES_KEY, value);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }

  return (
    <div>
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Link href="/you" className="crumb">
              This is You
            </Link>{" "}
            — Notes
          </p>
          <h1>Notes</h1>
          <p className="intro-copy">
            A safe pocket. Write when you want; skip it when you don&apos;t.
          </p>
        </div>
      </div>

      <article className="module-card">
        <label className="login-field notes-field">
          <span>Your notes</span>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(event) => persist(event.target.value)}
            placeholder="Write when you want; skip it when you don't."
            rows={10}
            disabled={!ready}
          />
        </label>
        <p className="field-hint" aria-live="polite">
          {saved ? "Saved on this device." : "Kept on this device."}
        </p>
      </article>
    </div>
  );
}
