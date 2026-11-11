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

import { RAINFALL_DATA, SOIL_MOISTURE_DATA, TEMPERATURE_DATA } from "@/lib/farm-data";
import { farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";

const TABS = [
  { id: "rainfall", label: "Rainfall (GPM)" },
  { id: "soil", label: "Soil Moisture (SMAP)" },
  { id: "temp", label: "Temperature (MODIS LST)" },
  { id: "drought", label: "Drought Risk Index" },
];

export function ClimateScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);
  const [climateTab, setClimateTab] = useState("rainfall");

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
              GPM Precipitation Telemetry (Monthly mm)
            </h2>
            <span className="text-xs font-semibold text-app-info bg-app-info-soft px-2.5 py-1 rounded-full">
              Seasonal Cumulative: 896 mm
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RAINFALL_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="actual"
                  fill="var(--app-success)"
                  name="Recorded Precipitation (mm)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="average"
                  fill="var(--app-gold)"
                  name="Historical 10-Yr Mean (mm)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {climateTab === "soil" && (
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-app-heading">
            SMAP Soil Moisture Stratification (% Volume)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SOIL_MOISTURE_DATA}>
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
                  name="Topsoil Surface (0-5 cm)"
                />
                <Area
                  type="monotone"
                  dataKey="rootzone"
                  stroke="var(--app-heading)"
                  fill="none"
                  strokeWidth={2}
                  name="Rootzone Depth (0-100 cm)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {climateTab === "temp" && (
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-app-heading">
            Land Surface Temperature (LST °C) Curve
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TEMPERATURE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[10, 35]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="maxTemp"
                  stroke="var(--app-danger)"
                  strokeWidth={2}
                  name="Max Daytime LST (°C)"
                />
                <Line
                  type="monotone"
                  dataKey="minTemp"
                  stroke="var(--app-success)"
                  strokeWidth={2}
                  name="Min Nighttime LST (°C)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
              <p className="text-2xl font-extrabold text-app-success">68 / 100</p>
              <p className="text-app-ink/70">Favorable agricultural condition.</p>
            </div>
            <div className="p-4 bg-app-bg rounded-xl border border-app-ink/10 space-y-1">
              <span className="font-bold text-app-heading text-sm">
                SPI 3-Month Rainfall Anomaly
              </span>
              <p className="text-2xl font-extrabold text-app-warning">+0.42</p>
              <p className="text-app-ink/70">Near-normal precipitation balance.</p>
            </div>
            <div className="p-4 bg-app-danger-soft rounded-xl border border-app-danger space-y-1">
              <span className="font-bold text-app-danger text-sm">Temperature Heat Stress</span>
              <p className="text-2xl font-extrabold text-app-danger">Low Risk</p>
              <p className="text-app-danger">No thermal crop canopy damage.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
