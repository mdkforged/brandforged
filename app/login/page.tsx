"use client";

import { FormEvent, Suspense, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";
import { getEnergyStrike } from "@/lib/brand/energy-strike";
import {
  DEFAULT_ACCOUNT_KIND,
  defaultSolutionFocus,
  type AccountKind,
  type SolutionFocus,
} from "@/lib/access/doors";

type Mode = "signin" | "signup";

const PLATFORM_STRIKE = getEnergyStrike("forge-green");

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const configured = useMemo(() => isAuthConfigured(), []);
  const [mode, setMode] = useState<Mode>("signin");
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountKind, setAccountKind] = useState<AccountKind | null>(null);
  const [solutionFocus, setSolutionFocus] = useState<SolutionFocus | null>(
    null,
  );
  const [pickedKind, setPickedKind] = useState(false);
  const [pickedFocus, setPickedFocus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function pickAccountKind() {
    setAccountKind(DEFAULT_ACCOUNT_KIND);
    setPickedKind(true);
  }

  function pickSolutionFocus() {
    const kind = accountKind ?? DEFAULT_ACCOUNT_KIND;
    setSolutionFocus(defaultSolutionFocus(kind));
    setPickedFocus(true);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured) return;

    if (mode === "signup" && signupStep === 1) {
      if (!email.trim() || !password) {
        setError("Add your email and password to continue.");
        return;
      }
      setError(null);
      setSignupStep(2);
      return;
    }

    if (mode === "signup" && signupStep === 2) {
      if (!accountKind) {
        setError(
          "Tell us if this is for an individual or a business - or tap You pick for me.",
        );
        return;
      }
      if (!solutionFocus) {
        setError(
          "Tell us if you want all branding or the all-in-one business solution - or tap You pick for me.",
        );
        return;
      }
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
              solution_focus: solutionFocus,
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
          "Account created. If email confirm is on, check your inbox - or ask your builder to confirm you.",
        );
        setMode("signin");
        setSignupStep(1);
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
                  setSignupStep(1);
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
                  setSignupStep(1);
                  setError(null);
                  setInfo(null);
                }}
              >
                Create account
              </button>
            </div>

            {mode === "signup" ? (
              <p className="step-pill">
                Step {signupStep} of 2
                {" Â· "}
                {signupStep === 1 ? "Account" : "What you're building"}
              </p>
            ) : null}

            <form className="login-form" onSubmit={onSubmit}>
              {mode === "signin" || signupStep === 1 ? (
                <>
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
                </>
              ) : null}

              {mode === "signup" && signupStep === 2 ? (
                <>
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
                        <span>
                          Personal brand, artist, creator - This is You first.
                        </span>
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
                        <span>
                          Company or team - still starts on This is You; Your
                          World is an upgrade.
                        </span>
                      </button>
                    </div>
                    <small className="field-hint">
                      {pickedKind
                        ? "We picked Individual. Change it if this is a business."
                        : "We need this at signup so we set you up right."}
                    </small>
                  </div>

                  <div className="account-kind">
                    <div className="field-head">
                      <span>All branding or all-in-one business?</span>
                      <button
                        type="button"
                        className="pick-one"
                        onClick={pickSolutionFocus}
                      >
                        You pick for me
                      </button>
                    </div>
                    <div
                      className="goal-options"
                      role="radiogroup"
                      aria-label="Branding or all-in-one"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={solutionFocus === "branding"}
                        className={
                          solutionFocus === "branding"
                            ? "goal-option is-active"
                            : "goal-option"
                        }
                        onClick={() => {
                          setSolutionFocus("branding");
                          setPickedFocus(false);
                        }}
                      >
                        <strong>All branding</strong>
                        <span>
                          Look, voice, posts - This is You, forged around you.
                        </span>
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={solutionFocus === "all_in_one"}
                        className={
                          solutionFocus === "all_in_one"
                            ? "goal-option is-active"
                            : "goal-option"
                        }
                        onClick={() => {
                          setSolutionFocus("all_in_one");
                          setPickedFocus(false);
                        }}
                      >
                        <strong>All-in-one business</strong>
                        <span>
                          {"Branding plus the business side - request Your World when you're ready."}
                        </span>
                      </button>
                    </div>
                    <small className="field-hint">
                      {pickedFocus
                        ? accountKind === "business"
                          ? "We picked all-in-one for a business. Change it anytime."
                          : "We picked all branding. Change it if you want the full business solution."
                        : "So we know whether to aim at look-and-posts, or the full business path."}
                    </small>
                  </div>
                </>
              ) : null}

              {error ? (
                <p className="login-alert" role="alert">
                  {error}
                </p>
              ) : null}
              {info ? <p className="login-info">{info}</p> : null}

              {mode === "signup" && signupStep === 2 ? (
                <div className="step-actions">
                  <button
                    type="button"
                    className="step-back"
                    onClick={() => setSignupStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="login-submit"
                    type="submit"
                    disabled={pending}
                  >
                    {pending ? "Working..." : "Create account"}
                  </button>
                </div>
              ) : (
                <button
                  className="login-submit"
                  type="submit"
                  disabled={pending}
                >
                  {pending
                    ? "Working..."
                    : mode === "signup"
                      ? "Continue"
                      : "Sign in"}
                </button>
              )}
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
            <p className="login-copy">Loading...</p>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}