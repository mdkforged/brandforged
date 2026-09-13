"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { hasWorldAccess, type DoorAccess } from "@/lib/access/doors";
import { HOME_DOORS, WORLD_UPGRADE_COPY } from "@/lib/home/doors";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";

export function HomeDoorNav() {
  const [doorAccess, setDoorAccess] = useState<DoorAccess>("you");
  const worldOpen = hasWorldAccess(doorAccess);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isAuthConfigured()) return;
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("profiles")
          .select("door_access")
          .eq("id", user.id)
          .maybeSingle();
        if (!cancelled && data?.door_access === "both") {
          setDoorAccess("both");
        } else if (!cancelled) {
          setDoorAccess("you");
        }
      } catch {
        // stay on default This is You only
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="home-doors" role="navigation" aria-label="Home">
      {HOME_DOORS.map((door) => {
        const locked = door.id === "world" && !worldOpen;
        if (locked) {
          return (
            <div
              key={door.id}
              className={`home-door home-door-${door.id} is-locked`}
              aria-disabled="true"
            >
              <p className="door-upgrade-badge">{WORLD_UPGRADE_COPY.badge}</p>
              <h2>{door.label}</h2>
              <p>{WORLD_UPGRADE_COPY.summary}</p>
            </div>
          );
        }
        return (
          <Link
            key={door.id}
            href={door.href}
            className={`home-door home-door-${door.id}`}
          >
            <h2>{door.label}</h2>
            <p>{door.summary}</p>
          </Link>
        );
      })}
    </div>
  );
}