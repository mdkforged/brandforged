"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasWorldAccess,
  isFounderEmail,
  type DoorAccess,
  type ProfileAccess,
  type SolutionFocus,
} from "@/lib/access/doors";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";

const EMPTY: ProfileAccess = {
  door_access: "you",
  account_kind: null,
  solution_focus: null,
  world_upgrade_requested_at: null,
  onboarding_completed_at: null,
};

export function useProfileAccess() {
  const [profile, setProfile] = useState<ProfileAccess>(EMPTY);
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isAuthConfigured()) {
      setReady(true);
      return;
    }
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        setEmail(null);
        setDisplayName(null);
        setProfile(EMPTY);
        setReady(true);
        return;
      }
      setSignedIn(true);
      setEmail(user.email ?? null);
      const { data } = await supabase
        .from("profiles")
        .select(
          "display_name, door_access, account_kind, solution_focus, world_upgrade_requested_at, onboarding_completed_at",
        )
        .eq("id", user.id)
        .maybeSingle();
      const name =
        (typeof data?.display_name === "string" && data.display_name.trim()) ||
        user.email ||
        null;
      setDisplayName(name);
      setProfile({
        door_access:
        isFounderEmail(user.email) || data?.door_access === "both"
          ? "both"
          : "you",
        account_kind: (data?.account_kind as ProfileAccess["account_kind"]) ?? null,
        solution_focus:
          (data?.solution_focus as SolutionFocus | null | undefined) ?? null,
        world_upgrade_requested_at: data?.world_upgrade_requested_at ?? null,
        onboarding_completed_at: data?.onboarding_completed_at ?? null,
      });
    } catch {
      setProfile(EMPTY);
      setEmail(null);
      setDisplayName(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function requestWorldUpgrade() {
    if (!isAuthConfigured()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("request_world_upgrade", {
        note: "Requested from home / Your World",
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setBusy(false);
    }
  }

  return {
    ready,
    signedIn,
    email,
    displayName,
    busy,
    error,
    profile,
    worldOpen:
      hasWorldAccess(profile.door_access as DoorAccess) ||
      isFounderEmail(email),
    requested: Boolean(profile.world_upgrade_requested_at),
    wantsAllInOne: profile.solution_focus === "all_in_one",
    onboardingDone: Boolean(profile.onboarding_completed_at),
    requestWorldUpgrade,
    reload,
  };
}