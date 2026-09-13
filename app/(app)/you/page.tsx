import type { Metadata } from "next";
import { LockedAsYouPhotos } from "@/components/you/locked-as-you-photos";
import { QuickSocialPostsBox } from "@/components/you/quick-social-posts-box";
import { YouHomeGreeting } from "@/components/you/you-home-greeting";

export const metadata: Metadata = {
  title: "This is You | Brand Forged",
  description: "A quiet place for who you are and what you make.",
};

const modules = [
  {
    title: "Voice",
    note: "How you sound. We'll keep this close to you - nothing to fill out yet.",
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
      <YouHomeGreeting />

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