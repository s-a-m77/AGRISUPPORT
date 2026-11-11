import { Link } from "@tanstack/react-router";
import { Sparkles, Leaf, Droplets, CloudSun, AlertTriangle, ChevronRight } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTx } from "@/lib/i18n";

import { KpiCard, MapCanvas } from "@/components/app/MapCanvas";
import { SOIL_MOISTURE_DATA } from "@/lib/farm-data";
import {
  alertsQueryOptions,
  farmsQueryOptions,
  pickActiveFarm,
  profileQueryOptions,
} from "@/lib/queries";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function DashboardScreen() {
  const tx = useTx();
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const { data: alerts } = useSuspenseQuery(alertsQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);
  const unread = alerts.filter((alert) => !alert.read).length;

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-app-action to-app-success-fill rounded-2xl p-6 text-app-on-action shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tx("Good morning, {name}", { name: profile.displayName })}</h1>
          <p className="text-xs text-app-on-action/80 mt-1">
            {tx("Active Farm:")}{" "}
            <span className="font-bold text-app-warning">{farm ? tx(farm.name) : tx("No plot yet")}</span>
            {farm ? ` • ${farm.woreda}, ${farm.region}` : ` • ${tx("add your first plot to begin")}`}
          </p>
        </div>

        <Link
          to="/ai"
          className="px-4 py-2.5 rounded-xl bg-app-gold hover:bg-app-gold text-app-heading font-bold text-xs shadow transition flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>{tx("Analyze My Farm with AI")}</span>
        </Link>
      </div>

      {farm === null ? (
        <div className="bg-app-surface rounded-2xl p-8 border border-app-ink/10 shadow-sm text-center space-y-3">
          <h2 className="text-lg font-bold text-app-heading">{tx("Register your first plot")}</h2>
          <p className="text-xs text-app-ink/70 max-w-md mx-auto">
{tx("Add a plot with its crop and size, and AgriSense begins fetching satellite observations for that field.")}
          </p>
          <Link
            to="/farms"
            className="inline-flex px-5 py-2.5 rounded-xl bg-app-action text-app-on-action text-xs font-bold shadow transition"
          >
{tx("Register a plot")}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title={tx("Crop Health (NDVI)")}
              value={farm.ndvi.toFixed(2)}
              badge={tx(farm.healthStatus)}
              subtext={tx("{change} vs last 10-day pass", { change: farm.ndviChange })}
              icon={Leaf}
              color="text-app-success"
            />
            <KpiCard
              title={tx("Season Rainfall")}
              value="142 mm"
              badge={tx("86% of Normal")}
              subtext={tx("165 mm 5-year seasonal avg")}
              icon={Droplets}
              color="text-app-info"
            />
            <KpiCard
              title={tx("Topsoil Moisture")}
              value={farm.moisture}
              badge={tx("Moderate")}
              subtext={tx("SMAP Satellite Passive Radar")}
              icon={CloudSun}
              color="text-app-warning"
            />
            <KpiCard
              title={tx("Climate Drought Risk")}
              value={tx(farm.droughtRisk)}
              badge={tx("Stable")}
              subtext={tx("VHI Index Standard")}
              icon={AlertTriangle}
              color="text-app-danger"
            />
          </div>

          <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-app-heading">
{tx("Registered Farm Boundaries & Vegetation Layer")}
                </h2>
                <p className="text-xs text-app-ink/60">
{tx("Showing boundary coordinate polygons overlaid on satellite tiles.")}
                </p>
              </div>
              <Link
                to="/satellite"
                className="px-3 py-1.5 rounded-lg bg-app-soft text-app-success hover:bg-app-success-fill hover:text-app-on-action text-xs font-semibold transition"
              >
{tx("Full Screen Satellite Map")}
              </Link>
            </div>
            <MapCanvas farm={farm} layerType="NDVI" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-app-heading">{tx("Soil Moisture Trend (SMAP)")}</h3>
                <span className="text-[10px] text-app-ink/60">{tx("30-day History")}</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SOIL_MOISTURE_DATA}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--app-line)"
                    />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 60]} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="surface"
                      stroke="var(--app-success)"
                      fill="var(--app-soft)"
                      name={tx("Surface %")}
                    />
                    <Area
                      type="monotone"
                      dataKey="rootzone"
                      stroke="var(--app-heading)"
                      fill="none"
                      strokeDasharray="3 3"
                      name={tx("Rootzone %")}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-app-ink/70">
{tx("Rootzone moisture remains stable above stress threshold (25%).")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-app-soft to-app-surface rounded-2xl p-5 border border-app-success/30 shadow-sm space-y-3 lg:col-span-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-app-success">
                  <Sparkles className="w-5 h-5 text-app-warning" />
                  <span className="text-xs font-bold uppercase tracking-wider">
{tx("AI Agronomist Recommendation")}
                  </span>
                </div>
                <h3 className="text-base font-bold text-app-heading">
{tx("Optimal Weather Window for Field Preparation in {place}", { place: tx(farm.woreda || farm.region) })}
                </h3>
                <p className="text-xs text-app-ink/80 leading-relaxed">
"{tx("NDVI values for {crop} show standard canopy maturity at {ndvi}. SMAP satellite telemetry indicates zero rainfall forecast over the next 8 days. Prepare labor and drying tarps for post-harvest operations.", { crop: tx(farm.crop), ndvi: farm.ndvi.toFixed(2) })}"
                </p>
              </div>
              <div className="pt-3 border-t border-app-success/20 flex items-center justify-between text-xs">
                <span className="text-app-ink/60">
                  {tx("Source: NASA POWER API & Landsat 9")} •{" "}
                  {unread > 0
                    ? tx("{count} unread alerts", { count: unread })
                    : tx("All alerts read")}
                </span>
                <Link
                  to="/ai"
                  className="font-bold text-app-success hover:text-app-heading flex items-center space-x-1"
                >
                  <span>{tx("Ask Advisor Details")}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
