import { Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle, CloudSun, Droplets, Leaf, Sparkles } from "lucide-react";

import { KpiCard, MapCanvas } from "@/components/app/MapCanvas";
import {
  dashboardTelemetryQueryOptions,
  farmsQueryOptions,
  pickActiveFarm,
  profileQueryOptions,
} from "@/lib/queries";
function MetricSkeleton() {
  return <div className="h-20 animate-pulse rounded-2xl bg-app-bg" />;
}

export function DashboardScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const selectedFarm = pickActiveFarm(farms, profile.activeFarmId);
  const farm = selectedFarm;
  const telemetry = useQuery({
    ...dashboardTelemetryQueryOptions(selectedFarm?.id),
    enabled: Boolean(selectedFarm),
  });
  const rainfall = telemetry.data?.rainfallMm;
  const soilMoisture = telemetry.data?.soilMoisturePercent;
  const temperature = telemetry.data?.temperatureC;
  const climateRisk =
    soilMoisture !== undefined &&
    soilMoisture !== null &&
    rainfall !== undefined &&
    (soilMoisture < 25 && rainfall < 50
      ? "High"
      : soilMoisture < 40 || rainfall < 80
        ? "Medium"
        : "Low");

  return (
    <div className="space-y-5 pb-12">
      <header className="flex items-start justify-between px-1">
        <div>
          <h1 className="text-xl font-extrabold text-app-heading">
            Good morning, {profile.displayName}!
          </h1>
          <p className="mt-1 text-xs font-medium text-app-ink/60">
            Here&apos;s your agricultural overview.
          </p>
        </div>
        <Link
          to="/ai"
          className="hidden items-center gap-2 rounded-xl bg-app-gold px-3 py-2 text-xs font-bold text-app-heading shadow-sm sm:flex"
        >
          <Sparkles className="size-4" /> Ask Advisor
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {telemetry.isLoading ? (
          Array.from({ length: 4 }, (_, index) => <MetricSkeleton key={index} />)
        ) : (
          <>
            <KpiCard title="Crop Health" value={selectedFarm?.ndvi && selectedFarm.ndvi > 0 ? selectedFarm.ndvi.toFixed(2) : "--"} badge={selectedFarm?.ndviChange ?? "Unavailable"} subtext="NDVI" description="Satellite vegetation health score for the active farm." icon={Leaf} color="text-app-success" />
            <KpiCard title="Rainfall" value={rainfall === undefined ? "--" : `${rainfall.toFixed(0)} mm`} badge={telemetry.data?.rainfallTrend ?? "Unavailable"} subtext="Last 30 days" description="NASA POWER telemetry for the selected farm coordinates." icon={Droplets} color="text-app-info" />
            <KpiCard title="Soil Moisture" value={soilMoisture === null || soilMoisture === undefined ? "--" : `${soilMoisture.toFixed(0)}%`} badge={telemetry.data?.soilMoistureTrend ?? "Unavailable"} subtext="0–7 cm layer" description="NASA POWER estimated moisture at the selected farm." icon={CloudSun} color="text-app-warning" />
            <KpiCard title="Climate Risk" value={typeof climateRisk === "string" ? climateRisk : "--"} badge={typeof climateRisk === "string" && climateRisk === "Low" ? "Stable" : "Unavailable"} subtext={temperature === null || temperature === undefined ? "--" : `${temperature.toFixed(1)} °C average`} description="Calculated from telemetry for the selected farm." icon={AlertTriangle} color="text-app-danger" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-app-ink/10 bg-app-surface p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <h2 className="text-sm font-bold text-app-heading">Your Farm</h2>
              <p className="text-[11px] text-app-ink/60">
                {selectedFarm ? selectedFarm.name : "Register and select a farm to view its data"}
              </p>
            </div>
            <Link to="/farms" className="text-[11px] font-bold text-app-success">Manage farm</Link>
          </div>
          <MapCanvas farm={farm} layerType="NDVI" />
        </section>

        <section className="flex flex-col justify-between rounded-2xl border border-app-ink/10 bg-app-surface p-5 shadow-sm">
          <div>
            <div className="mb-4 flex items-center gap-2 text-app-success">
              <Sparkles className="size-5" />
              <h2 className="text-sm font-bold text-app-heading">Latest Recommendation</h2>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-app-heading">
              {climateRisk === "Low"
                ? "Your crops are healthy. Keep monitoring for possible dry conditions next week."
                : climateRisk
                  ? "Review soil moisture and plan irrigation or water conservation actions this week."
                  : "Register and select a farm to receive location-based telemetry."}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-app-ink/65">
              {telemetry.data
                ? `Based on ${telemetry.data.source} telemetry and your farm profile.`
                : "No farm-specific telemetry is available yet."}
            </p>
          </div>
          <Link to="/ai" className="mt-6 inline-flex items-center justify-center rounded-xl bg-app-success-fill px-4 py-3 text-xs font-bold text-app-on-action">
            View Details →
          </Link>
        </section>
      </div>
    </div>
  );
}
