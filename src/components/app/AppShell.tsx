import { useState } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sprout,
  BarChart3,
  MapPin,
  Layers,
  CloudSun,
  Sparkles,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  CircleHelp,
} from "lucide-react";

import { useTx } from "@/lib/i18n";
import { ThemeSelector } from "@/components/AppTheme";
import { initialsOf, roleLabel, SUPPORTED_LANGUAGES } from "@/lib/farm-data";
import {
  alertsQueryOptions,
  farmsQueryOptions,
  pickActiveFarm,
  profileQueryOptions,
  useChooseFarm,
  useSaveProfile,
} from "@/lib/queries";
import { useSignOut } from "@/lib/session";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/farms", label: "My Farms", icon: MapPin },
  { to: "/satellite", label: "Satellite Intel", icon: Layers },
  { to: "/climate", label: "Climate Monitoring", icon: CloudSun },
  { to: "/ai", label: "AI Advisor", icon: Sparkles, badge: "AI" },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
  { to: "/reports", label: "Reports", icon: FileText },
] as const;

const MOBILE_ITEMS = [
  { to: "/dashboard", label: "Home", icon: BarChart3 },
  { to: "/farms", label: "Farms", icon: MapPin },
  { to: "/satellite", label: "Satellite", icon: Layers },
  { to: "/ai", label: "AI Chat", icon: Sparkles },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle },
] as const;

export function AppShell() {
  const location = useLocation();
  const tx = useTx();
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: alerts } = useSuspenseQuery(alertsQueryOptions());

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chooseFarm = useChooseFarm();
  const saveProfile = useSaveProfile();
  const signOut = useSignOut();

  const active = pickActiveFarm(farms, profile.activeFarmId);
  const unreadCount = alerts.filter((alert) => !alert.read).length;
  const pathname = location.pathname;

  function isActive(to: string) {
    return pathname === to || pathname.startsWith(`${to}/`);
  }

  function switchLanguage(language: string) {
    if (language === profile.language) return;
    saveProfile.mutate(
      { displayName: profile.displayName, language, role: profile.role },
      { onError: (error) => toast.error(error.message) },
    );
  }

  const sidebar = (
    <aside className="fixed md:static inset-y-0 left-0 z-50 w-64 bg-app-nav text-app-nav-ink flex flex-col border-r border-app-success/30 shadow-2xl md:shadow-none">
      <div className="p-5 border-b border-app-nav-ink/10 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-app-success-fill to-app-gold flex items-center justify-center shadow-lg">
            <Sprout className="w-6 h-6 text-app-nav-ink" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-wide text-app-nav-ink">AgriSense</h1>
            <p className="text-[10px] text-app-nav-ink/70 tracking-widest uppercase">
              ETHIOPIA CLIMATE-TECH
            </p>
          </div>
        </Link>
        <button
          className="md:hidden text-app-nav-ink/70 hover:text-app-nav-ink"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 py-3 bg-scrim/20 border-b border-app-nav-ink/5">
        <label
          htmlFor="active-farm"
          className="text-[11px] font-semibold uppercase tracking-wider text-app-warning block mb-1"
        >
          Active Farm
        </label>
        <select
          id="active-farm"
          className="w-full bg-app-success-fill/40 border border-app-nav-ink/15 rounded-lg px-2.5 py-1.5 text-xs text-app-nav-ink focus:outline-none focus:ring-2 focus:ring-app-gold"
          value={active?.id ?? ""}
          onChange={(event) =>
            chooseFarm.mutate(event.target.value, {
              onSuccess: () => toast("Active plot updated"),
              onError: (error) => toast.error(error.message),
            })
          }
        >
          {farms.length === 0 && <option value="">{tx("No plots yet")}</option>}
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id} className="bg-app-nav text-app-nav-ink">
              {farm.name} ({farm.crop})
            </option>
          ))}
        </select>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const activeItem = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeItem
                  ? "bg-app-success-fill text-app-on-action shadow-md border border-app-nav-ink/20"
                  : "text-app-nav-ink/80 hover:bg-app-nav-ink/10 hover:text-app-nav-ink"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-5 h-5 ${activeItem ? "text-app-warning" : "text-app-nav-ink/70"}`}
                />
                <span>{tx(item.label)}</span>
              </div>
              {"badge" in item && item.badge && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-app-gold text-app-heading rounded-full">
                  {item.badge}
                </span>
              )}
              {item.to === "/alerts" && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-app-danger text-app-nav-ink rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-app-nav-ink/10 space-y-2">
        <Link
          to="/help"
          onClick={() => setMobileMenuOpen(false)}
          className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive("/help")
              ? "bg-app-success-fill text-app-on-action"
              : "text-app-nav-ink/70 hover:bg-app-nav-ink/10 hover:text-app-nav-ink"
          }`}
        >
          <CircleHelp className="w-4 h-4" />
          <span>{tx("Help Center")}</span>
        </Link>
        <Link
          to="/settings"
          onClick={() => setMobileMenuOpen(false)}
          className={`w-full flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
            isActive("/settings")
              ? "bg-app-success-fill text-app-on-action"
              : "text-app-nav-ink/70 hover:bg-app-nav-ink/10 hover:text-app-nav-ink"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{tx("Settings")}</span>
        </Link>

        <div className="pt-2 border-t border-app-nav-ink/5 flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-full bg-app-success-fill border border-app-gold flex items-center justify-center font-bold text-xs text-app-nav-ink">
              {initialsOf(profile.displayName)}
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-semibold text-app-nav-ink leading-tight truncate">
                {profile.displayName}
              </p>
              <p className="text-[10px] text-app-nav-ink/60 truncate">{roleLabel(profile.role)}</p>
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            title={tx("Sign out")}
            aria-label="Sign out"
            className="text-app-nav-ink/40 hover:text-app-nav-ink p-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen text-app-ink font-sans flex flex-col md:flex-row antialiased selection:bg-app-success-fill selection:text-app-on-action bg-app-bg">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-scrim/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`${mobileMenuOpen ? "" : "hidden "}md:block fixed md:static inset-y-0 left-0 z-50`}
      >
        {sidebar}
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-30 bg-app-surface/90 backdrop-blur-md border-b border-app-ink/10 px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-app-soft text-app-heading hover:bg-app-success-fill hover:text-app-on-action transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-app-heading capitalize">
                {tx(NAV_ITEMS.find((item) => isActive(item.to))?.label ?? "Settings")}
              </h2>
              <p className="text-xs text-app-ink/60 hidden sm:block">
                NASA Satellite Sentinel • Live Farm Stream:{" "}
                <span className="font-semibold text-app-success">
                  {active?.name ?? "No plot registered"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelector />

            <div className="hidden sm:flex items-center bg-app-bg border border-app-ink/15 rounded-full p-1 text-xs">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language}
                  onClick={() => switchLanguage(language)}
                  className={`px-2.5 py-1 rounded-full font-medium transition ${
                    profile.language === language
                      ? "bg-app-action text-app-on-action shadow-sm"
                      : "text-app-ink/70 hover:text-app-heading"
                  }`}
                >
                  {language === "English" ? "EN" : language === "Amharic" ? "አማ" : "OR"}
                </button>
              ))}
            </div>

            <Link
              to="/alerts"
              className="relative p-2 rounded-xl bg-app-soft text-app-heading hover:bg-app-success-fill hover:text-app-on-action transition"
              aria-label={`Alerts${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-app-danger ring-2 ring-app-surface animate-ping" />
              )}
            </Link>

            <Link
              to="/ai"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-app-action to-app-success-fill text-app-on-action text-xs font-semibold hover:shadow-md transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-app-warning" />
              <span className="hidden md:inline">{tx("Ask AI Advisor")}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-nav text-app-nav-ink border-t border-app-on-action/10 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const activeItem = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center py-1 px-3 rounded-lg relative ${
                activeItem
                  ? "text-app-warning font-bold"
                  : "text-app-nav-ink/70 hover:text-app-nav-ink"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{tx(item.label)}</span>
              {item.to === "/alerts" && unreadCount > 0 && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-app-danger" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
