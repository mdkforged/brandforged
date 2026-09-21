import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WorldAccessGate } from "@/components/home/world-access-gate";
import { WORLD_ROOMS, worldRoomBySlug } from "../rooms";

export function generateStaticParams() {
  return WORLD_ROOMS.map((room) => ({ room: room.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ room: string }>;
}): Promise<Metadata> {
  const { room } = await params;
  const item = worldRoomBySlug(room);
  return {
    title: item
      ? `${item.title} | Your World | Brand Forged`
      : "Your World | Brand Forged",
  };
}

export default async function WorldRoomPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;
  const item = worldRoomBySlug(room);
  if (!item) notFound();

  return (
    <WorldAccessGate>
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            <Link href="/world" className="crumb">
              Your World
            </Link>
            {` — ${item.title}`}
          </p>
          <h1>{item.title}</h1>
          <p className="intro-copy">{item.note}</p>
        </div>
      </div>

      <article className="module-card">
        <h2>{item.title}</h2>
        <p>{item.note}</p>
      </article>
    </WorldAccessGate>
  );
}
