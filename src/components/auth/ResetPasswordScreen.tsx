import { useTx } from "@/lib/i18n";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sprout } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-app-ink/20 bg-app-bg text-sm focus:ring-2 focus:ring-app-success focus:outline-none";

export function ResetPasswordScreen() {
  const tx = useTx();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  // The recovery link carries the new session in the URL hash; wait for it before asking for a password.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated. You are signed in.");
      await navigate({ to: "/dashboard", replace: true });
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
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-app-surface rounded-3xl p-6 md:p-8 border border-app-ink/10 shadow-xl space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-app-heading">{tx("Choose a new password")}</h1>
            <p className="text-xs text-app-ink/70">
              {ready
                ? tx("Your reset link worked. Set a password you will remember.")
                : tx("Open the reset link from your email to continue.")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                className="block font-medium text-app-heading mb-1 text-xs"
                htmlFor="new-password"
              >
                {tx("New Password")}
              </label>
              <input
                id="new-password"
                type="password"
                required
                disabled={!ready}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label
                className="block font-medium text-app-heading mb-1 text-xs"
                htmlFor="confirm-password"
              >
                {tx("Confirm Password")}
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                disabled={!ready}
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={!ready || busy}
              className="w-full py-3 rounded-xl bg-app-action hover:bg-app-success-fill text-app-on-action font-bold text-sm shadow-md transition disabled:opacity-60"
            >
              {busy ? "Saving…" : tx("Save new password")}
            </button>
          </form>

          {!ready && (
            <p className="text-[11px] text-app-ink/60">
              If you opened this page directly, use the link in the password reset email instead.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
