"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { hasWorldAccess, type DoorAccess } from "@/lib/access/doors";
import { WORLD_UPGRADE_COPY } from "@/lib/home/doors";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";

export function WorldAccessGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [doorAccess, setDoorAccess] = useState<DoorAccess>("you");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!isAuthConfigured()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setReady(true);
          return;
        }
        const { data } = await supabase
          .from("profiles")
          .select("door_access")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled) {
          setDoorAccess(data?.door_access === "both" ? "both" : "you");
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <article className="module-card">
        <p>Checking access…</p>
      </article>
    );
  }

  if (!hasWorldAccess(doorAccess)) {
    return (
      <article className="module-card look-card">
        <p className="door-upgrade-badge">{WORLD_UPGRADE_COPY.badge}</p>
        <h2>Your World</h2>
        <p>{WORLD_UPGRADE_COPY.cta}</p>
        <p>
          <Link href="/you">Go to This is You</Link>
        </p>
      </article>
    );
  }

  return <>{children}</>;
}