import Link from "next/link";
import type { Metadata } from "next";
import { HOME_DOORS } from "@/lib/home/doors";

export const metadata: Metadata = {
  title: "Home | Brand Forged",
  description: "Two doors: This is You, and Your World.",
};

export default function HomePage() {
  return (
    <div className="home-forged">
      <div className="home-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="home-hero-logo"
          src="/brand/logo-forge-green.webp"
          alt="Brand Forged"
          width={220}
          height={220}
        />
        <p className="home-wordmark">
          <span>Brand</span> <strong>Forged</strong>
        </p>
      </div>

      <div className="page-intro">
        <div>
          <p className="eyebrow">Home</p>
          <h1>You&apos;re home.</h1>
          <p className="intro-copy">
            Two places. That&apos;s all. Pick one and we&apos;ll take it from there.
          </p>
        </div>
      </div>

      <div className="home-doors" role="navigation" aria-label="Home">
        {HOME_DOORS.map((door) => (
          <Link
            key={door.id}
            href={door.href}
            className={`home-door home-door-${door.id}`}
          >
            <h2>{door.label}</h2>
            <p>{door.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
