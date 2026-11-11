import { useEffect, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

import { ThemeSelector } from "@/components/AppTheme";
import {
  AGRICULTURAL_ROLES,
  SUPPORTED_LANGUAGES,
  roleLabel,
  type AgriculturalRole,
} from "@/lib/farm-data";
import { profileQueryOptions, useSaveProfile } from "@/lib/queries";
import { useSignOut } from "@/lib/session";

export function SettingsScreen() {
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const saveProfile = useSaveProfile();
  const signOut = useSignOut();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [language, setLanguage] = useState(profile.language);
  const [role, setRole] = useState<AgriculturalRole>(profile.role);

  // Keep the form in step with the stored profile after any other screen saves it.
  useEffect(() => {
    setDisplayName(profile.displayName);
    setLanguage(profile.language);
    setRole(profile.role);
  }, [profile.displayName, profile.language, profile.role]);

  const dirty =
    displayName !== profile.displayName || language !== profile.language || role !== profile.role;

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (displayName.trim().length < 2) {
      toast.error("Enter your full name before saving.");
      return;
    }
    saveProfile.mutate(
      { displayName: displayName.trim(), language, role },
      {
        onSuccess: () => toast.success("Profile saved. Your details now follow you to any device."),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm">
        <h1 className="text-2xl font-bold text-app-heading">Settings & Platform Preferences</h1>
        <p className="text-xs text-app-ink/70">
          Manage your account, language and notification channels.
        </p>
      </div>

      <div className="bg-app-surface rounded-2xl p-6 border border-app-ink/10 shadow-sm space-y-6 text-xs">
        <div className="flex items-center justify-between gap-4 border-b pb-4">
          <h2 className="text-base font-bold text-app-heading">Appearance</h2>
          <ThemeSelector />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-base font-bold text-app-heading border-b pb-2">Your Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full p-2.5 rounded-xl bg-app-bg border border-app-ink/15"
              />
            </div>
            <div>
              <label className="block font-medium mb-1" htmlFor="profile-role">
                Agricultural Focus
              </label>
              <select
                id="profile-role"
                value={role}
                onChange={(event) => setRole(event.target.value as AgriculturalRole)}
                className="w-full p-2.5 rounded-xl border border-app-ink/20 bg-app-bg"
              >
                {AGRICULTURAL_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {roleLabel(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="profile-language">
              Preferred Language
            </label>
            <select
              id="profile-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full p-2.5 rounded-xl border border-app-ink/20 bg-app-bg"
            >
              {SUPPORTED_LANGUAGES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={!dirty || saveProfile.isPending}
              className="px-5 py-2.5 rounded-xl bg-app-action hover:bg-app-success-fill text-app-on-action font-bold text-xs shadow transition disabled:opacity-50"
            >
              {saveProfile.isPending ? "Saving…" : "Save Profile"}
            </button>
            {dirty && (
              <span className="text-[11px] text-app-ink/60">You have unsaved changes.</span>
            )}
          </div>
        </form>

        <div className="space-y-4 pt-4 border-t border-app-ink/10">
          <h2 className="text-base font-bold text-app-heading">Rural Advisory Delivery Channels</h2>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-app-success" />
              <div>
                <p className="font-semibold text-app-heading">
                  SMS Text Alert Push (Amharic / Afaan Oromo)
                </p>
                <p className="text-[10px] text-app-ink/60">
                  Receive urgent drought and heavy rain alerts even without internet connection.
                </p>
              </div>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 accent-app-success" />
              <div>
                <p className="font-semibold text-app-heading">Weekly Telegram Advisory Digest</p>
                <p className="text-[10px] text-app-ink/60">
                  Get weekly AI crop recommendations pushed directly to your phone.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-app-ink/10">
          <h2 className="text-base font-bold text-app-heading">
            Help Center & NASA Data Integration FAQ
          </h2>
          <div className="space-y-2 bg-app-bg p-4 rounded-xl">
            <p className="font-bold text-app-heading">
              Q: How often is satellite data updated on AgriSense?
            </p>
            <p className="text-app-ink/80">
              MODIS vegetation telemetry updates every 1-2 days, while high-resolution Landsat 8/9
              imagery updates on an 8-day repeat cycle across Ethiopia.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-app-ink/10 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-app-heading">Signed in as {profile.displayName}</p>
            <p className="text-[10px] text-app-ink/60">
              Signing out keeps your plots and alerts saved.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="shrink-0 inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-app-danger/40 text-app-danger hover:bg-app-danger hover:text-app-on-action text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
