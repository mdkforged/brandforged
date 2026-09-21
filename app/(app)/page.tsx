import type { Metadata } from "next";
import { HomeDoorNav } from "@/components/home/home-door-nav";
import { HomeGetStarted } from "@/components/home/home-get-started";

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
          <h1>{"You're home."}</h1>
          <p className="intro-copy">
            Start with This is You. Your World opens when you upgrade.
          </p>
          <HomeGetStarted />
        </div>
      </div>

      <HomeDoorNav />
    </div>
  );
}
