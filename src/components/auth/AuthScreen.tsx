import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, MailCheck, Sprout } from "lucide-react";

import { ThemeSelector } from "@/components/AppTheme";
import { LanguageSelector, useTx } from "@/lib/i18n";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

type Mode = "signin" | "signup" | "forgot" | "confirm-sent";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-app-ink/20 bg-app-bg text-sm focus:ring-2 focus:ring-app-success focus:outline-none";

function GoogleMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const navigate = useNavigate();
  const tx = useTx();

  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Someone who is already signed in has no reason to stay on this screen.
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function finishSignIn() {
    await navigate({ to: "/dashboard", replace: true });
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in did not complete. Try again.");
        return;
      }
      if (result.redirected) return;
      await finishSignIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in did not complete.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "That email and password do not match."
            : error.message,
        );
        return;
      }
      await finishSignIn();
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2) {
      toast.error("Enter your full name first.");
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        setMode("confirm-sent");
        return;
      }
      await finishSignIn();
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password reset link sent. Check your inbox.");
      setMode("signin");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <header className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-app-ink/10">
        <Link to="/" className="flex items-center gap-2">
          <Sprout className="w-7 h-7 text-app-success" />
          <div className="leading-tight">
            <p className="text-lg font-extrabold text-app-heading">AgriSense</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-app-ink/60">
              Ethiopia
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : void navigate({ to: "/" }))}
            className="inline-flex items-center gap-1 rounded-md border border-app-line px-2 py-1.5 text-xs font-semibold text-app-ink hover:text-app-heading"
          >
            <ArrowLeft className="size-4" /> {tx("Back")}
          </button>
          <LanguageSelector />
          <ThemeSelector />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-app-surface rounded-3xl p-6 md:p-8 border border-app-ink/10 shadow-xl space-y-6">
          {mode === "confirm-sent" ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-app-soft text-app-success flex items-center justify-center mx-auto">
                <MailCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold text-app-heading">{tx("Confirm your email")}</h1>
              <p className="text-xs text-app-ink/70 leading-relaxed">
                <strong className="text-app-heading">{email}</strong>
                <br />
                {tx("We sent a confirmation link to your email. Open it to activate your account — your plots and alerts are then created automatically.")}
              </p>
              <button
                onClick={() => setMode("signin")}
                className="w-full py-3 rounded-xl bg-app-action hover:bg-app-success-fill text-app-on-action font-bold text-sm transition"
              >
                {tx("Back to sign in")}
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-app-heading">
                  {mode === "signin"
                    ? tx("Welcome back")
                    : mode === "signup"
                      ? tx("Create your account")
                      : tx("Reset your password")}
                </h1>
                <p className="text-xs text-app-ink/70">
                  {mode === "signin"
                    ? tx("Sign in to see your plots, alerts and satellite reports.")
                    : mode === "signup"
                      ? tx("Join Ethiopia's satellite climate-tech network.")
                      : tx("We will email you a link to choose a new password.")}
                </p>
              </div>

              {mode !== "forgot" && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleGoogle()}
                    disabled={busy}
                    className="w-full flex items-center justify-center gap-[10px] py-3 rounded-xl border font-semibold text-sm transition disabled:opacity-60"
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#747775",
                      color: "#1F1F1F",
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}
                  >
                    <GoogleMark />
                    <span>{tx("Continue with Google")}</span>
                  </button>

                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider text-app-ink/50">
                    <span className="h-px flex-1 bg-app-ink/10" />
                    <span>{tx("or use your email")}</span>
                    <span className="h-px flex-1 bg-app-ink/10" />
                  </div>
                </>
              )}

              <form
                onSubmit={
                  mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleReset
                }
                className="space-y-3"
              >
                {mode === "signup" && (
                  <div>
                    <label
                      className="block font-medium text-app-heading mb-1 text-xs"
                      htmlFor="auth-name"
                    >
                      {tx("Full Name")}
                    </label>
                    <input
                      id="auth-name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Abebe Kebede"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label
                    className="block font-medium text-app-heading mb-1 text-xs"
                    htmlFor="auth-email"
                  >
                    {tx("Email")}
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={inputClass}
                  />
                </div>

                {mode !== "forgot" && (
                  <div>
                    <label
                      className="block font-medium text-app-heading mb-1 text-xs"
                      htmlFor="auth-password"
                    >
                      {tx("Password")}
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      placeholder={tx("At least 8 characters")}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                {mode === "signup" && (
                  <div>
                    <label
                      className="block font-medium text-app-heading mb-1 text-xs"
                      htmlFor="auth-confirm"
                    >
                      {tx("Confirm Password")}
                    </label>
                    <input
                      id="auth-confirm"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-app-action hover:bg-app-success-fill text-app-on-action font-bold text-sm shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  <span>
                    {mode === "signin"
                      ? tx("Sign in")
                      : mode === "signup"
                        ? tx("Create account")
                        : tx("Send reset link")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-xs text-app-ink/70">
                {mode === "signin" ? (
                  <>
                    <button
                      onClick={() => setMode("forgot")}
                      className="underline hover:text-app-heading"
                    >
                      {tx("Forgot password?")}
                    </button>
                    <button
                      onClick={() => setMode("signup")}
                      className="font-semibold text-app-success hover:text-app-heading"
                    >
                      {tx("Create an account")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setMode("signin")}
                    className="font-semibold text-app-success hover:text-app-heading"
                  >
                    {tx("Back to sign in")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
