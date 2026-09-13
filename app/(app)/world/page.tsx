import type { Metadata } from "next";
import { WorldAccessGate } from "@/components/home/world-access-gate";

export const metadata: Metadata = {
  title: "Your World | Brand Forged",
  description: "The people, money, and work around what you are building.",
};

const modules = [
  {
    title: "People",
    note: "Who you're talking with. We'll keep names and next steps in one place.",
  },
  {
    title: "Money",
    note: "What came in and what went out. Quiet numbers, when you need them.",
  },
  {
    title: "Campaigns",
    note: "The work that's live. We'll show status so you don't have to hunt.",
  },
  {
    title: "Calendar",
    note: "What's next. Reminders that work for you — not a chore list.",
  },
];

export default function YourWorldPage() {
  return (
    <WorldAccessGate>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Your World</p>
          <h1>What you&apos;re building.</h1>
          <p className="intro-copy">
            People, money, and the work around you. We&apos;ll keep this useful and
            quiet so you get time back.
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
    </WorldAccessGate>
  );
}