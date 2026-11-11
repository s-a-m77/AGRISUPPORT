import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { MapCanvas } from "@/components/app/MapCanvas";
import { HISTORICAL_NDVI_DATA } from "@/lib/farm-data";
import { farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";

const LAYERS = ["True Color", "NDVI", "Vegetation Health", "Historical Baseline"];

export function SatelliteScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);

  const [activeLayer, setActiveLayer] = useState("NDVI");
  const satelliteSource = "Landsat 9";

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-heading">Satellite Vegetation Intelligence</h1>
          <p className="text-xs text-app-ink/70">
            Multispectral imagery telemetry for{" "}
            <span className="font-bold text-app-success">{farm?.name ?? "your plots"}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-app-bg p-1 rounded-xl border border-app-ink/10 text-xs">
          {LAYERS.map((layer) => (
            <button
              key={layer}
              onClick={() => setActiveLayer(layer)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeLayer === layer
                  ? "bg-app-action text-app-on-action shadow-sm"
                  : "text-app-ink/70 hover:text-app-heading"
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between text-xs text-app-ink/70">
          <span>
            Satellite Source:{" "}
            <strong className="text-app-heading">{satelliteSource} (30m Spatial Resolution)</strong>
          </span>
          <span>
            Cloud Cover: <strong className="text-app-success">0.4% Optimal Tile Quality</strong>
          </span>
        </div>

        <MapCanvas farm={farm} layerType={activeLayer} />
      </div>

      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-app-heading">
              NDVI Season Trajectory vs 5-Year Historical Average
            </h2>
            <p className="text-xs text-app-ink/60">
              Normalised Difference Vegetation Index trajectory across crop lifecycle.
            </p>
          </div>
          <span className="text-xs font-bold text-app-success bg-app-soft px-3 py-1 rounded-full">
            Current Index: {farm ? farm.ndvi.toFixed(2) : "--"} (
            {farm ? farm.ndviChange : "no plot"})
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={HISTORICAL_NDVI_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-line)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 1.0]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="current2026"
                stroke="var(--app-success)"
                strokeWidth={3}
                name="2026 Current Season NDVI"
                dot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="baseline5Yr"
                stroke="var(--app-gold)"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="5-Year Historical Mean"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-4 bg-app-soft rounded-xl border border-app-success/20 text-xs text-app-heading leading-relaxed">
          <strong>NDVI Educational Note:</strong> NDVI measures canopy greenness between -1.0 and
          +1.0. Values between 0.6 and 0.8 represent healthy, dense agricultural vegetation during
          peak grain filling for Ethiopian crops like Teff and Wheat.
        </div>
      </div>
    </div>
  );
}
