import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Sprout, UserRound } from "lucide-react";

import { ThemeSelector } from "@/components/AppTheme";
import { LanguageSelector, useLang, useTx, type Lang } from "@/lib/i18n";
import { api } from "@/lib/api";
import { roleValue } from "@/lib/farm-data";

type Mode = "signin" | "signup" | "forgot";
type Onboarding = {
  agriculturalRole: string;
  language: Lang;
  region: string;
  zone: string;
  latitude: string;
  longitude: string;
  crop: string;
  concern: string;
};

const initialOnboarding: Onboarding = {
  agriculturalRole: "",
  language: "en",
  region: "Oromia",
  zone: "",
  latitude: "",
  longitude: "",
  crop: "Teff (Quncho / Magal)",
  concern: "",
};
const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-app-ink/20 bg-app-bg text-sm focus:ring-2 focus:ring-app-success focus:outline-none";
const cardClass =
  "w-full max-w-xl bg-app-surface rounded-3xl p-6 md:p-9 border border-app-ink/10 shadow-xl";
const options = {
  roles: ["Smallholder Farmer", "Agricultural Expert", "Climate Researcher", "Cooperative Leader"],
  languages: [
    { code: "en" as const, label: "English", profileValue: "English" },
    { code: "am" as const, label: "አማርኛ (Amharic)", profileValue: "Amharic" },
    { code: "om" as const, label: "Afaan Oromoo", profileValue: "Afaan Oromo" },
  ],
  regions: [
    "Oromia",
    "Amhara",
    "SNNPR",
    "Tigray",
    "Sidama",
    "Afar",
    "Somali",
    "Benishangul-Gumuz",
    "Gambela",
    "Harari",
    "Dire Dawa",
    "Addis Ababa",
  ],
  crops: [
    "Teff (Quncho / Magal)",
    "Durum Wheat",
    "Maize",
    "Sorghum",
    "Barley",
    "Arabica Coffee",
    "Other",
  ],
  concerns: [
    "Drought & Water Stress",
    "Crop Disease / Health Decline",
    "Rainfall Unpredictability",
    "Heat Stress & Solar Index",
    "Irrigation Efficiency",
    "Yield Maximization",
  ],
};

export function AuthScreen() {
  const navigate = useNavigate();
  const tx = useTx();
  const { lang, setLang } = useLang();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [onboarding, setOnboarding] = useState<Onboarding>(initialOnboarding);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    setOnboarding((current) => ({ ...current, language: lang }));
  }, [lang]);

  useEffect(() => {
    let active = true;
    void api.auth.getUser().then(({ data }) => {
      if (active && data.user) void navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function finishSignIn() {
    await navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await api.auth.signIn({ email: email.trim(), password });
      await finishSignIn();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await api.auth.resetPasswordForEmail();
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createAccount(withWizard: boolean) {
    if (fullName.trim().length < 2) {
      toast.error("Enter your full name first.");
      setStep(0);
      return;
    }
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      setStep(0);
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The two passwords do not match.");
      setStep(0);
      return;
    }
    setBusy(true);
    try {
      await api.auth.signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        agriculturalRole: withWizard ? onboarding.agriculturalRole : "Smallholder Farmer",
        role: withWizard ? roleValue(onboarding.agriculturalRole) : "farmer",
        language: withWizard
          ? options.languages.find(({ code }) => code === onboarding.language)!.profileValue
          : "English",
        region: "",
        zone: "",
        latitude: null,
        longitude: null,
        crop: "",
        farmSizeHectares: null,
        concern: withWizard ? onboarding.concern : "Drought & Water Stress",
      });
      setLang(withWizard ? onboarding.language : "en");
      setSetupComplete(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  function startWizard(event: React.FormEvent) {
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
    setStep(1);
  }

  function update<K extends keyof Onboarding>(key: K, value: Onboarding[K]) {
    setOnboarding((current) => ({ ...current, [key]: value }));
  }

  const fieldLabel = "block text-xs font-semibold text-app-heading mb-1.5";
  const selectClass = `${inputClass} min-h-12`;
  const selectedCard = "border-app-success bg-app-success/10 ring-2 ring-app-success";

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
            onClick={() =>
              window.history.length > 1 ? window.history.back() : void navigate({ to: "/" })
            }
            className="inline-flex items-center gap-1 rounded-md border border-app-line px-2 py-1.5 text-xs font-semibold text-app-ink hover:text-app-heading"
          >
            <ArrowLeft className="size-4" /> {tx("Back")}
          </button>
          <LanguageSelector />
          <ThemeSelector />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        {mode === "signup" && step > 0 ? (
          <section className={cardClass} aria-labelledby="onboarding-title">
            {!setupComplete ? (
              <>
                <div className="flex items-center justify-between gap-3 border-b border-app-ink/10 pb-5 mb-7">
                  <div className="flex items-center gap-3">
                    <Sprout className="size-7 text-app-success" />
                    <h1 id="onboarding-title" className="font-bold text-app-heading">
                      {tx("AgriSense Onboarding")}
                    </h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="rounded-full bg-app-success/10 text-app-success px-4 py-2 text-sm font-semibold">
                      {tx("Step {n} of 3", { n: step })}
                    </span>
                    <button
                      type="button"
                      onClick={() => void createAccount(false)}
                      disabled={busy}
                      className="text-sm text-app-ink/70 underline underline-offset-2"
                    >
                      {tx("Skip wizard")}
                    </button>
                  </div>
                </div>
                <div className="min-h-72">
                  <h2 className="text-2xl font-bold leading-snug text-app-heading">
                    {tx(
                      [
                        "",
                        "Step 1: What is your primary agricultural role?",
                        "Step 2: Choose your preferred language",
                        "Step 3: Primary Agricultural Concern",
                      ][step]!,
                    )}
                  </h2>
                  <p className="mt-1 mb-6 text-sm text-app-ink/70">
                    {tx(
                      [
                        "",
                        "We tailor satellite telemetry display to your operational focus.",
                        "AgriSense supports major Ethiopian national languages.",
                        "We prioritize critical warning notifications on your home dashboard.",
                      ][step]!,
                    )}
                  </p>

                  {step === 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.roles.map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => update("agriculturalRole", role)}
                          aria-pressed={onboarding.agriculturalRole === role}
                          className={`min-h-28 rounded-2xl border p-4 text-left font-semibold transition ${onboarding.agriculturalRole === role ? selectedCard : "border-app-ink/15 hover:border-app-success/60"}`}
                        >
                          <UserRound className="size-6 mb-5 text-app-success" />
                          {tx(role)}
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-2">
                      {options.languages.map((language) => (
                        <button
                          key={language.code}
                          type="button"
                          onClick={() => {
                            update("language", language.code);
                            setLang(language.code);
                          }}
                          aria-pressed={onboarding.language === language.code}
                          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left font-semibold ${onboarding.language === language.code ? selectedCard : "border-app-ink/15 hover:border-app-success/60"}`}
                        >
                          {language.label}
                          {onboarding.language === language.code && (
                            <Check className="size-5 text-app-success" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {step === 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {options.concerns.map((concern) => (
                        <button
                          key={concern}
                          type="button"
                          onClick={() => update("concern", concern)}
                          aria-pressed={onboarding.concern === concern}
                          className={`min-h-20 rounded-2xl border p-4 text-left text-sm font-semibold transition ${onboarding.concern === concern ? selectedCard : "border-app-ink/15 hover:border-app-success/60"}`}
                        >
                          {tx(concern)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-app-ink/10 pt-5">
                  <button
                    type="button"
                    disabled={step === 1}
                    onClick={() => setStep((current) => Math.max(1, current - 1))}
                    className="px-3 py-2 text-sm font-semibold text-app-ink/70 disabled:opacity-40"
                  >
                    Back
                  </button>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep((current) => current + 1)}
                      disabled={(step === 1 && !onboarding.agriculturalRole) || busy}
                      className="rounded-xl bg-app-action px-7 py-3 text-sm font-bold text-app-on-action disabled:opacity-50"
                    >
                      {tx("Next Step")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void createAccount(true)}
                      disabled={!onboarding.concern || busy}
                      className="rounded-xl bg-amber-500 px-7 py-3 text-sm font-bold text-white disabled:opacity-50"
                    >
                      {busy ? tx("Creating account…") : tx("Complete Setup")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mx-auto mb-7 flex size-20 items-center justify-center rounded-full bg-app-success/10">
                  <CircleCheck className="size-12 text-app-success" />
                </div>
                <h1 className="text-3xl font-bold text-app-heading">
                  {tx("Welcome, {name}!", { name: fullName.trim() })}
                </h1>
                <p className="mx-auto mt-4 max-w-md text-app-ink/70">
                  {tx("Your AgriSense profile is configured. {details}Your dashboard is ready.", {
                    details: [onboarding.zone, tx(onboarding.crop)].filter(Boolean).length
                      ? `${[onboarding.zone, tx(onboarding.crop)].filter(Boolean).join(" · ")} · `
                      : "",
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => void finishSignIn()}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-app-heading px-5 py-4 font-bold text-white shadow-md"
                >
                  {tx("Explore My Dashboard")} <ArrowRight className="size-5" />
                </button>
              </div>
            )}
          </section>
        ) : (
          <div className="w-full max-w-md bg-app-surface rounded-3xl p-6 md:p-8 border border-app-ink/10 shadow-xl space-y-6">
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
            <form
              onSubmit={
                mode === "signin" ? handleSignIn : mode === "signup" ? startWizard : handleReset
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
                    required
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
                      ? tx("Continue to setup")
                      : tx("Send reset link")}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-xs text-app-ink/70">
              {mode === "signin" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="underline hover:text-app-heading"
                  >
                    {tx("Forgot password?")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="font-semibold text-app-success hover:text-app-heading"
                  >
                    {tx("Create an account")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-semibold text-app-success hover:text-app-heading"
                >
                  {tx("Back to sign in")}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
