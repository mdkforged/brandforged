import type { Metadata } from "next";
import Link from "next/link";
import { WorldAccessGate } from "@/components/home/world-access-gate";
import { WORLD_ROOMS } from "./rooms";

export const metadata: Metadata = {
  title: "Your World | Brand Forged",
  description: "The people, money, and work around what you are building.",
};

export default function YourWorldPage() {
  return (
    <WorldAccessGate>
      <div className="page-intro">
        <div>
          <p className="eyebrow">Your World</p>
          <h1>{"What you're building."}</h1>
          <p className="intro-copy">
            {
              "People, money, and the work around you. We'll keep this useful and quiet so you get time back."
            }
          </p>
        </div>
      </div>

      <div className="module-grid">
        {WORLD_ROOMS.map((item) => (
          <Link
            className="module-card module-card-link"
            href={`/world/${item.slug}`}
            key={item.slug}
          >
            <h2>{item.title}</h2>
            <p>{item.note}</p>
          </Link>
        ))}
      </div>
    </WorldAccessGate>
  );
}
