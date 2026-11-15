import { useEffect, useState } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { MapCanvas } from "@/components/app/MapCanvas";
import { farmPowerQueryOptions, farmsQueryOptions, pickActiveFarm, profileQueryOptions, satelliteSummaryQueryOptions } from "@/lib/queries";

const LAYERS = [
  { label: "MODIS True Color", map: "True Color", source: "MODIS Terra", resolution: "250 m" },
  { label: "MODIS NDVI", map: "NDVI", source: "MODIS Terra", resolution: "250 m" },
  { label: "GPM IMERG Rainfall", map: "Rainfall", source: "GPM IMERG", resolution: "10 km" },
  { label: "VIIRS", map: "Vegetation Health", source: "VIIRS", resolution: "375 m" },
] as const;

export function SatelliteScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);
  const [activeLayer, setActiveLayer] = useState<(typeof LAYERS)[number]["map"]>("NDVI");
  const [date, setDate] = useState<string>();
  const summary = useQuery({
    ...satelliteSummaryQueryOptions(farm?.id ?? ""),
    enabled: Boolean(farm),
  });
  const power = useQuery({
    ...farmPowerQueryOptions(farm?.id ?? ""),
    enabled: Boolean(farm),
  });
  const selected = LAYERS.find((layer) => layer.map === activeLayer) ?? LAYERS[1];

  useEffect(() => {
    const observationDate = summary.data?.latestModis?.observedOn;
    if (observationDate && !date) setDate(observationDate);
  }, [date, summary.data?.latestModis?.observedOn]);

  if (!farm) {
    return <div className="rounded-2xl border border-app-ink/10 bg-app-surface p-8 text-sm text-app-ink/70">Register a farm with a boundary or coordinates to view NASA satellite imagery.</div>;
  }

  const latest = summary.data?.latestModis;
  const rainfall = power.data?.days.reduce((total, day) => total + (day.precipitationMm ?? 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <header className="rounded-2xl border border-app-ink/10 bg-app-surface p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-app-heading">Satellite Vegetation Intelligence</h1>
        <p className="mt-1 text-xs text-app-ink/70">NASA GIBS visualizations and farm-specific observations for <strong>{farm.name}</strong>.</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-app-ink/10 bg-app-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {LAYERS.map((layer) => (
            <button key={layer.map} onClick={() => setActiveLayer(layer.map)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${activeLayer === layer.map ? "bg-app-action text-app-on-action" : "bg-app-bg text-app-ink/70"}`}>
              {layer.label}
            </button>
          ))}
          <label className="ml-auto text-xs text-app-ink/70">Observation date <input type="date" value={date ?? ""} onChange={(event) => setDate(event.target.value || undefined)} className="ml-1 rounded border border-app-line bg-app-surface px-2 py-1" /></label>
        </div>
        <MapCanvas farm={farm} layerType={activeLayer} date={date} />
        <p className="text-[11px] text-app-ink/60">
          NASA GIBS / {selected.source} • {selected.resolution}.{" "}
          {date ? `Observation date: ${date}.` : "No valid observation date is available yet."} Map colors are imagery only and are not numeric NDVI measurements.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric title="Latest MODIS NDVI" value={latest?.ndvi == null ? "--" : Number(latest.ndvi).toFixed(3)} detail={latest ? `${latest.observedOn} • ${latest.qualityStatus ?? "quality unavailable"}` : "No processed MOD13Q1 observation"} />
        <Metric title="30-day NASA POWER rainfall" value={rainfall == null ? "--" : `${rainfall.toFixed(1)} mm`} detail="Regional estimate; not a rain-gauge reading" />
        <Metric title="HLS NDVI" value={summary.data?.latestHls?.ndvi == null ? "--" : Number(summary.data.latestHls.ndvi).toFixed(3)} detail="30 m observation unavailable until processing completes" />
      </section>

      <button className="inline-flex items-center gap-2 rounded-xl bg-app-success-fill px-4 py-2 text-xs font-bold text-app-on-action" disabled>
        <RefreshCw className="size-3.5" /> Refresh requires Earthdata processing credentials
      </button>
    </div>
  );
}

function Metric({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-app-ink/10 bg-app-surface p-4 shadow-sm"><p className="text-xs font-bold text-app-ink/70">{title}</p><p className="mt-2 text-2xl font-extrabold text-app-heading">{value}</p><p className="mt-1 text-[11px] text-app-ink/60">{detail}</p></div>;
}
