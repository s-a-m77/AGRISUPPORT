import { Link } from "@tanstack/react-router";
import { MapPinned, Satellite, BrainCircuit, Leaf, Droplets, CloudRain, Layers, Mail, ArrowRight, Sprout } from "lucide-react";

import heroImg from "@/assets/ethiopia-farmland-hero-full.jpg";
import { useT, useTx } from "@/lib/i18n";

function MapArt() {
  return (
    <svg viewBox="0 0 240 140" className="sc-art h-full w-full" aria-hidden="true">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeOpacity=".12" />
        </pattern>
      </defs>
      <rect width="240" height="140" fill="url(#grid)" />
      <polygon className="sc-draw" points="40,100 70,35 140,28 195,70 160,115 80,120" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="2" />
      {[[70, 35], [140, 28], [195, 70], [160, 115], [80, 120], [40, 100]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" className="fill-showcase-surface" stroke="currentColor" strokeWidth="2" />
      ))}
      <g className="sc-pin"><circle cx="118" cy="72" r="7" fill="currentColor" /><circle cx="118" cy="72" r="14" fill="currentColor" fillOpacity=".18" /></g>
    </svg>
  );
}

function SatArt() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg">
      <img src={heroImg} alt="" className="sc-art h-full w-full object-cover" loading="lazy" />
      <div className="sc-scan absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-showcase-accent/40 to-transparent" />
      <div className="absolute bottom-2 left-2 flex gap-1.5">
        {["NDVI", "SMAP", "GPM"].map((l) => (
          <span key={l} className="rounded-full bg-showcase-surface/90 px-2 py-0.5 text-[10px] font-bold text-showcase-ink">{l}</span>
        ))}
      </div>
    </div>
  );
}

function AiArt() {
  const bars = [38, 62, 48, 80, 56, 92, 70];
  return (
    <div className="flex h-full w-full items-end gap-2 px-4 pb-3">
      {bars.map((h, i) => (
        <div key={i} className="sc-bar flex-1 rounded-t-md bg-showcase-accent/70" style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />
      ))}
    </div>
  );
}

const cards = [
  { n: "01", icon: MapPinned, title: "f1Title", desc: "f1Desc", Art: MapArt, tint: "bg-showcase-soft" },
  { n: "02", icon: Satellite, title: "f2Title", desc: "f2Desc", Art: SatArt, tint: "bg-showcase-surface" },
  { n: "03", icon: BrainCircuit, title: "f3Title", desc: "f3Desc", Art: AiArt, tint: "bg-showcase-soft" },
] as const;

const datasets = [
  { icon: Layers, name: "Landsat 8/9", desc: "Surface Reflectance" },
  { icon: Leaf, name: "MODIS Terra", desc: "Vegetation Index (NDVI)" },
  { icon: Droplets, name: "SMAP Mission", desc: "Soil Moisture" },
  { icon: CloudRain, name: "GPM Core", desc: "Precipitation Measurements" },
];

export function FeatureShowcase() {
  const t = useT();
  const tx = useTx();
  return (
    <div className="showcase ml-[calc(50%_-_50vw)] mr-[calc(50%_-_50vw)] bg-showcase-bg text-showcase-ink">
      <div className="mx-auto max-w-6xl space-y-28 px-6 py-24">
        <section id="features" className="space-y-14">
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <p data-home-reveal className="text-xs font-bold tracking-[0.2em] text-showcase-accent">{t("scLabel")}</p>
            <h2 data-home-reveal className="text-balance text-3xl font-extrabold tracking-tight text-showcase-heading md:text-5xl">{t("scTitle")}</h2>
            <p data-home-reveal className="sc-delay mx-auto max-w-2xl text-pretty text-base leading-relaxed text-showcase-muted">{t("scDesc")}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map(({ n, icon: Icon, title, desc, Art, tint }, i) => (
              <article
                key={n}
                data-home-reveal
                style={{ transitionDelay: `${i * 140}ms` }}
                className="sc-card group flex flex-col overflow-hidden rounded-3xl border border-showcase-line bg-showcase-surface shadow-[var(--showcase-shadow)]"
              >
                <div className={`relative h-44 text-showcase-accent ${tint} p-3`}>
                  <Art />
                  <span className="absolute right-4 top-3 text-xs font-bold text-showcase-muted">{n}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-7">
                  <div className="sc-icon flex size-12 items-center justify-center rounded-2xl bg-showcase-soft text-showcase-accent">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="text-xl font-bold text-showcase-heading">{t(title)}</h3>
                  <p className="text-sm leading-relaxed text-showcase-muted">{t(desc)}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="nasa" className="grid items-center gap-12 md:grid-cols-2">
          <div data-home-reveal className="sc-from-left space-y-5">
            <p className="text-xs font-bold tracking-[0.2em] text-showcase-accent">{t("nasaLabel")}</p>
            <h2 className="text-balance text-3xl font-extrabold tracking-tight text-showcase-heading md:text-4xl">{t("nasaTitle")}</h2>
            <p className="text-base leading-relaxed text-showcase-muted">{t("nasaDesc")}</p>
            <Link to="/help" className="inline-flex items-center gap-2 rounded-full bg-showcase-heading px-6 py-3 text-sm font-bold text-showcase-surface transition hover:gap-3">
              {t("nasaCta")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div data-home-reveal className="sc-from-right space-y-4">
            <figure className="sc-parallax-wrap overflow-hidden rounded-3xl border border-showcase-line shadow-[var(--showcase-shadow)]">
              <img src={heroImg} alt="Illustrative view of Ethiopian highland farmland" className="sc-parallax aspect-[4/3] w-full object-cover" loading="lazy" />
              <figcaption className="bg-showcase-surface px-4 py-2 text-[11px] text-showcase-muted">{t("nasaCaption")}</figcaption>
            </figure>
            <div className="grid grid-cols-2 gap-3">
              {datasets.map(({ icon: Icon, name, desc }, i) => (
                <div key={name} data-home-reveal style={{ transitionDelay: `${200 + i * 110}ms` }} className="flex items-center gap-3 rounded-2xl border border-showcase-line bg-showcase-surface p-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-showcase-soft text-showcase-accent"><Icon className="size-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-showcase-heading">{name}</p>
                    <p className="truncate text-[11px] text-showcase-muted">{tx(desc)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer data-home-reveal className="space-y-8 border-t border-showcase-line pt-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-2">
              <Sprout className="size-6 text-showcase-accent" />
              <span className="font-extrabold text-showcase-heading">AgriSense Ethiopia</span>
            </div>
            <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold text-showcase-muted">
              <a href="#about" className="hover:text-showcase-heading">{t("about")}</a>
              <a href="#features" className="hover:text-showcase-heading">{t("features")}</a>
              <Link to="/help" className="hover:text-showcase-heading">{t("helpSupport")}</Link>
              <a href="mailto:hello@agrisense.et" className="inline-flex items-center gap-1.5 hover:text-showcase-heading"><Mail className="size-4" />hello@agrisense.et</a>
            </nav>
          </div>
          <p className="text-xs text-showcase-muted">© {new Date().getFullYear()} AgriSense Ethiopia · {t("tagline")}</p>
        </footer>
      </div>
    </div>
  );
}
