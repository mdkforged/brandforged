"use client";

import { FormEvent, Suspense, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  DEFAULT_ACCOUNT_KIND,
  type AccountKind,
} from "@/lib/access/doors";

type Mode = "signin" | "signup";

/** Sign-in shows Forge Green only — Energy Strike choices are back-burnered. */
const PLATFORM_STRIKE = getEnergyStrike("forge-green");

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const configured = useMemo(() => isAuthConfigured(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountKind, setAccountKind] = useState<AccountKind | null>(null);
  const [pickedKind, setPickedKind] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function pickAccountKind() {
    setAccountKind(DEFAULT_ACCOUNT_KIND);
    setPickedKind(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;
    if (mode === "signup" && !accountKind) {
      setError("Tell us if this is for an individual or a business — or tap You pick for me.");
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              account_kind: accountKind,
            },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        if (data.session) {
          router.replace("/start");
          router.refresh();
          return;
        }
        setInfo(
          "Account created. If email confirm is on, check your inbox — or ask your builder to confirm you.",
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
            <div className="login-mode" role="tablist" aria-label="Account">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                className={mode === "signin" ? "is-active" : undefined}
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={mode === "signup" ? "is-active" : undefined}
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
              >
                Create account
              </button>
            </div>

            <form className="login-form" onSubmit={onSubmit}>
              <label className="login-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="login-field">
                <span>Password</span>
                <input
                  type="password"
                  required
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>

              {mode === "signup" ? (
                <div className="account-kind">
                  <div className="field-head">
                    <span>Is this for a business or an individual?</span>
                    <button
                      type="button"
                      className="pick-one"
                      onClick={pickAccountKind}
                    >
                      You pick for me
                    </button>
                  </div>
                  <div
                    className="goal-options"
                    role="radiogroup"
                    aria-label="Business or individual"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={accountKind === "individual"}
                      className={
                        accountKind === "individual"
                          ? "goal-option is-active"
                          : "goal-option"
                      }
                      onClick={() => {
                        setAccountKind("individual");
                        setPickedKind(false);
                      }}
                    >
                      <strong>Individual</strong>
                      <span>Personal brand, artist, creator — This is You first.</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={accountKind === "business"}
                      className={
                        accountKind === "business"
                          ? "goal-option is-active"
                          : "goal-option"
                      }
                      onClick={() => {
                        setAccountKind("business");
                        setPickedKind(false);
                      }}
                    >
                      <strong>Business</strong>
                      <span>Company or team — still starts on This is You; Your World is an upgrade.</span>
                    </button>
                  </div>
                  <small className="field-hint">
                    {pickedKind
                      ? "We picked Individual. Change it if this is a business."
                      : "We need this at signup so we set you up right."}
                  </small>
                </div>
              ) : null}

              {error ? (
                <p className="login-alert" role="alert">
                  {error}
                </p>
              ) : null}
              {info ? <p className="login-info">{info}</p> : null}

              <button className="login-submit" type="submit" disabled={pending}>
                {pending
                  ? "Working…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>
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
          <div className="login-card">
            <p className="login-copy">Loading…</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}