"use client";

import { FormEvent, Suspense, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";
import { getEnergyStrike } from "@/lib/brand/energy-strike";

type Mode = "signin" | "signup";

/** Sign-in shows Forge Green only â€” Energy Strike choices are back-burnered. */
const PLATFORM_STRIKE = getEnergyStrike("forge-green");

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const configured = useMemo(() => isAuthConfigured(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          router.replace(nextPath);
          router.refresh();
          return;
        }
        setInfo(
          "Account created. If email confirm is on, check your inbox â€” or ask your builder to confirm you.",
        );
        setMode("signin");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setPending(false);
    }
  }

  const energyStyle = {
    "--energy": PLATFORM_STRIKE.hex,
    "--energy-soft": `${PLATFORM_STRIKE.hex}33`,
  } as CSSProperties;

  return (
    <main className="login-page" style={energyStyle}>
      <div className="login-aura" aria-hidden />
      <div className="login-card">
        <div className="login-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="login-logo"
            src="/brand/logo-forge-green.webp"
            alt="Brand Forged"
            width={280}
            height={280}
          />
          <p className="login-wordmark">
            <span>Brand</span> <strong>Forged</strong>
          </p>
        </div>

        {!configured ? (
          <p className="login-copy">
            Authentication is not configured yet. Set the Supabase keys and reload.
          </p>
        ) : (
          <>
            <h1>{mode === "signup" ? "Create account" : "Welcome back"}</h1>
            <p className="login-copy">
              {mode === "signup"
                ? "One email. One password. Your workspace opens from here."
                : "Sign in to open your doors â€” This is You and Your World."}
            </p>

            <form className="login-form" onSubmit={onSubmit}>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  required
                  minLength={8}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              {error ? (
                <p className="login-alert" role="alert">
                  {error}
                </p>
              ) : null}
              {info ? <p className="login-info">{info}</p> : null}
              <button className="login-submit" type="submit" disabled={pending}>
                {pending
                  ? mode === "signup"
                    ? "Creatingâ€¦"
                    : "Signing inâ€¦"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <button
              type="button"
              className="login-switch"
              onClick={() => {
                setError(null);
                setInfo(null);
                setMode((current) =>
                  current === "signup" ? "signin" : "signup",
                );
              }}
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="login-page">
          <div className="login-aura" aria-hidden />
          <div className="login-card">
            <h1>Welcome back</h1>
            <p className="login-copy">Loadingâ€¦</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}