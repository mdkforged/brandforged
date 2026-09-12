import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "This is You | Brand Forged",
  description: "A quiet place for who you are and what you make.",
};

const modules = [
  {
    title: "Voice",
    note: "How you sound. We'll keep this close to you — nothing to fill out yet.",
  },
  {
    title: "Look",
    note: "Colors, type, and the feel of you. A place for this when you're ready.",
  },
  {
    title: "Ideas",
    note: "A soft catch for thoughts and posts. We'll hold them so you don't have to.",
  },
  {
    title: "Notes",
    note: "A safe pocket. Write when you want; skip it when you don't.",
  },
];

export default function ThisIsYouPage() {
  return (
    <>
      <div className="page-intro">
        <div>
          <p className="eyebrow">This is You</p>
          <h1>Who you are.</h1>
          <p className="intro-copy">
            Your voice, your look, your ideas. Nothing to set up. We&apos;ll gather
            this as we go so you can stay with the work that matters.
          </p>
        </div>
      </div>

      <div className="module-grid">
        {modules.map((item) => (
          <article className="module-card" key={item.title}>
            <h2>{item.title}</h2>
            <p>{item.note}</p>
          </article>
        ))}
      </div>
    </>
  );
}