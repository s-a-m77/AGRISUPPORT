import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { farmPowerQueryOptions, farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";

const TABS = [
  { id: "rainfall", label: "Rainfall (NASA POWER)" },
  { id: "soil", label: "Soil Wetness (NASA POWER)" },
  { id: "temp", label: "Temperature (NASA POWER)" },
  { id: "drought", label: "Drought Risk Index (pending)" },
];

export function ClimateScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);
  const [climateTab, setClimateTab] = useState("rainfall");
  const { data: power } = useSuspenseQuery({
    ...farmPowerQueryOptions(farm?.id ?? ""),
    enabled: Boolean(farm && (farm.latitude !== null || farm.boundaryGeojson !== null)),
  });
  const powerDays = power?.days ?? [];
  const rainfallData = powerDays.map((day) => ({
    day: `${day.date.slice(4, 6)}/${day.date.slice(6, 8)}`,
    precipitation: day.precipitationMm,
  }));
  const soilData = powerDays
    .filter((day) => day.soilWetness !== null)
    .map((day) => ({
      day: `${day.date.slice(4, 6)}/${day.date.slice(6, 8)}`,
      surface: day.soilWetness === null ? null : day.soilWetness * 100,
    }));
  const temperatureData = powerDays
    .filter((day) => day.temperatureC !== null)
    .map((day) => ({
      day: `${day.date.slice(4, 6)}/${day.date.slice(6, 8)}`,
      temperature: day.temperatureC,
    }));
  const rainfallTotal = powerDays.reduce(
    (total, day) => total + (day.precipitationMm ?? 0),
    0,
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-heading">Farm Climate Telemetry</h1>
          <p className="text-xs text-app-ink/70">
            NASA Earth Observation environmental indicator analytics
            {farm ? ` for ${farm.name}` : ""}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-app-bg p-1 rounded-xl border border-app-ink/10 text-xs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setClimateTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                climateTab === tab.id
                  ? "bg-app-action text-app-on-action shadow-sm"
                  : "text-app-ink/70 hover:text-app-heading"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {climateTab === "rainfall" && (
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-base font-bold text-app-heading">
              NASA POWER Precipitation Telemetry (Daily mm)
            </h2>
            <span className="text-xs font-semibold text-app-info bg-app-info-soft px-2.5 py-1 rounded-full">
              30-Day Total: {rainfallTotal.toFixed(1)} mm
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainfallData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="precipitation"
                  fill="var(--app-success)"
                  name="NASA POWER Precipitation (mm/day)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="rounded-xl bg-app-soft p-4 text-xs font-medium leading-relaxed text-app-ink/75">
            Each bar shows the corrected rainfall estimated by NASA POWER for that day in
            millimetres. Taller bars mean more water fell or was estimated for the farm location;
            the 30-day total adds the daily values and should be compared with crop water needs.
          </p>
        </div>
      )}

      {climateTab === "soil" && (
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-app-heading">
            NASA POWER Surface Soil Wetness (0-1)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={soilData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 60]} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="surface"
                  stroke="var(--app-success)"
                  fill="var(--app-soft)"
                  name="NASA POWER Surface Wetness (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="rounded-xl bg-app-soft p-4 text-xs font-medium leading-relaxed text-app-ink/75">
            This chart shows NASA POWER surface soil wetness as a percentage conversion from the
            0–1 source value. Higher values indicate wetter near-surface conditions, but they are
            an estimate and should be checked against field soil observations before irrigation.
          </p>
        </div>
      )}

      {climateTab === "temp" && (
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-app-heading">
            NASA POWER Temperature at 2 Meters (°C)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="var(--app-danger)"
                  strokeWidth={2}
                  name="NASA POWER T2M (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="rounded-xl bg-app-soft p-4 text-xs font-medium leading-relaxed text-app-ink/75">
            Each point is the NASA POWER average air temperature at 2 metres above the surface.
            Use the pattern to understand warming and cooling across the 30-day period; it is not
            the crop canopy or soil temperature.
          </p>
        </div>
      )}

      {climateTab === "drought" && (
        <div className="bg-app-surface rounded-2xl p-6 border border-app-ink/10 shadow-sm space-y-4 text-xs">
          <h2 className="text-base font-bold text-app-heading">
            Standardized Drought Classification Index
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-app-soft rounded-xl border border-app-success/30 space-y-1">
              <span className="font-bold text-app-heading text-sm">VHI (Vegetation Health)</span>
              <p className="text-2xl font-extrabold text-app-success">--</p>
              <p className="text-app-ink/70">Requires MODIS vegetation data.</p>
            </div>
            <div className="p-4 bg-app-bg rounded-xl border border-app-ink/10 space-y-1">
              <span className="font-bold text-app-heading text-sm">
                SPI 3-Month Rainfall Anomaly
              </span>
              <p className="text-2xl font-extrabold text-app-warning">--</p>
              <p className="text-app-ink/70">Requires a historical rainfall baseline.</p>
            </div>
            <div className="p-4 bg-app-danger-soft rounded-xl border border-app-danger space-y-1">
              <span className="font-bold text-app-danger text-sm">Temperature Heat Stress</span>
              <p className="text-2xl font-extrabold text-app-danger">--</p>
              <p className="text-app-danger">Requires crop-specific thresholds.</p>
            </div>
          </div>
          <p className="rounded-xl bg-app-soft p-4 text-xs font-medium leading-relaxed text-app-ink/75">
            These indicators are intentionally shown as pending until their required sources are
            connected. VHI needs MODIS vegetation observations, SPI needs a long-term rainfall
            baseline, and heat stress needs thresholds for the selected crop; no drought status is
            inferred from missing data.
          </p>
        </div>
      )}
    </div>
  );
}
