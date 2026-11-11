import { Link } from "@tanstack/react-router";
import { Sprout, Leaf } from "lucide-react";

import { ThemeSelector } from "@/components/AppTheme";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { LanguageSelector, useT, useTx } from "@/lib/i18n";
import { HomeMotion, HomePhotoGallery } from "@/components/HomeMotion";
import heroImg from "@/assets/ethiopia-farmland-hero-full.jpg";

export function LandingPage() {
  const t = useT();
  const tx = useTx();
  return (
    <HomeMotion>
      <section className="relative -mt-4 md:-mt-6 ml-[calc(50%_-_50vw)] mr-[calc(50%_-_50vw)] min-h-[90vh] flex flex-col overflow-hidden bg-landing-bg shadow-xl">
        <img
          src={heroImg}
          alt="Ethiopian highland farmland under satellite observation"
          width={1600}
          height={912}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <nav className="relative z-10 flex flex-wrap gap-3 items-center justify-between px-6 md:px-10 py-5">
          <div className="flex items-center gap-2">
            <Leaf className="w-9 h-9 text-app-success fill-app-success/20" />
            <div className="leading-tight [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_0_6px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.9)]">
              <p className="text-xl font-extrabold text-photo-ink">AgriSense</p>
              <p className="text-sm font-semibold text-photo-sage -mt-1">Ethiopia</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-photo-nav [text-shadow:0_0_3px_rgba(255,255,255,0.95),0_0_8px_rgba(255,255,255,0.9),0_0_14px_rgba(255,255,255,0.7)]">
            <a href="#about" className="hover:text-app-success">
              {t("about")}
            </a>
            <a href="#features" className="hover:text-app-success">
              {t("features")}
            </a>
            <Link to="/help" className="hover:text-app-success">
              {t("help")}
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeSelector />
            <Link
              to="/auth"
              className="px-5 py-2 rounded-full bg-app-action text-photo-ink text-sm font-bold hover:bg-app-success-fill transition"
            >
              {t("getStarted")}
            </Link>
          </div>
        </nav>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-10 pt-8 pb-16 md:pt-14 md:pb-24 max-w-xl space-y-5">
          <h1 className="home-intro-title text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] text-photo-ink [text-shadow:0_2px_6px_rgba(0,0,0,0.65),0_4px_22px_rgba(0,0,0,0.5)]">
            {t("heroA")}
            <br />
            {t("heroB")}
            <br />
            {t("heroC")}
          </h1>
          <p className="home-intro-copy text-base md:text-lg font-semibold text-photo-ink [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_0_6px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.9)]">
            {t("heroSub")}
          </p>
          <div className="home-intro-actions flex flex-wrap gap-3 pt-2">
            <Link
              to="/auth"
              className="px-7 py-3 rounded-full bg-app-action text-photo-ink font-bold hover:bg-app-success-fill transition shadow-lg"
            >
              {t("getStarted")}
            </Link>
            <Link
              to="/auth"
              className="px-7 py-3 rounded-full bg-photo-ink text-photo-nav font-bold border-2 border-app-action hover:bg-app-soft transition"
            >
              {t("createAccount")}
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-4 md:mx-10 mb-6 rounded-2xl bg-landing-bg/85 backdrop-blur shadow-lg border border-landing-line grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-landing-line text-sm">
          <div className="flex items-center justify-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-nasa text-app-on-action flex items-center justify-center text-[10px] font-black italic">
              NASA
            </div>
            <div className="leading-tight">
              <p className="font-bold text-landing-ink">{tx("Powered by")}</p>
              <p className="text-landing-muted">{tx("NASA Earth Observations")}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 p-4 font-semibold text-landing-ink">
            <Sprout className="w-5 h-5 text-landing-accent" />
            {tx("Smart Farming")}
          </div>
          <div className="flex items-center justify-center gap-2 p-4 font-semibold text-landing-ink">
            <Leaf className="w-5 h-5 text-landing-accent" />
            {tx("Climate Resilience")}
          </div>
        </div>
      </section>

      <section id="about" data-home-reveal className="space-y-6 px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-landing-ink">{t("aboutTitle")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(
            [
              ["mission", "missionText"],
              ["vision", "visionText"],
              ["tech", "techText"],
            ] as const
          ).map(([h, d]) => (
            <div key={h} className="bg-landing-surface rounded-2xl p-6 border border-landing-line space-y-2">
              <h3 className="text-lg font-bold text-landing-accent">{t(h)}</h3>
              <p className="text-sm text-landing-ink/85 leading-relaxed">{t(d)}</p>
            </div>
          ))}
        </div>
      </section>

      <HomePhotoGallery />

      <FeatureShowcase />
    </HomeMotion>
  );
}
