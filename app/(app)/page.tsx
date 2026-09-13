import type { Metadata } from "next";
import Link from "next/link";
import { HomeDoorNav } from "@/components/home/home-door-nav";

export const metadata: Metadata = {
  title: "Home | Brand Forged",
  description: "This is You — and Your World when you upgrade.",
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
            Start with This is You. Your World opens when you upgrade.
          </p>
          <p>
            <Link href="/start" className="door-upgrade-btn">
              Get started
            </Link>
          </p>
        </div>
      </div>

      <HomeDoorNav />
    </div>
  );
}