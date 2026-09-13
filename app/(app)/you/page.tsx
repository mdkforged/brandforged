import type { Metadata } from "next";
import { LockedAsYouPhotos } from "@/components/you/locked-as-you-photos";
import { QuickSocialPostsBox } from "@/components/you/quick-social-posts-box";

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

      <QuickSocialPostsBox />

      <article className="module-card look-card">
        <h2>Look</h2>
        <LockedAsYouPhotos />
      </article>

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