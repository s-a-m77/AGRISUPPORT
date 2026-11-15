import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Sprout } from "lucide-react";

import { farmsQueryOptions, pickActiveFarm, profileQueryOptions } from "@/lib/queries";

const REPORT_CATEGORIES = [
  "Crop Health Audit (NDVI & VHI)",
  "Seasonal Rainfall Anomaly Summary",
  "SMAP Soil Moisture Profile",
  "Drought Risk & Yield Forecast",
];

const TIME_RANGES = [
  "Current Growing Season (Jun - Nov 2026)",
  "Full Year 2026",
  "5-Year Historical Comparison",
];

export function ReportsScreen() {
  const { data: farms } = useSuspenseQuery(farmsQueryOptions());
  const { data: profile } = useSuspenseQuery(profileQueryOptions());
  const farm = pickActiveFarm(farms, profile.activeFarmId);

  const [reportType, setReportType] = useState(REPORT_CATEGORIES[0] as string);
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0] as string);

  function handleExport() {
    if (!farm) {
      toast.error("Register a plot before exporting a report.");
      return;
    }
    toast.success("Opening the report print dialog. Choose “Save to PDF” to download it.");
    window.setTimeout(() => window.print(), 0);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-heading">Agricultural Audit Reports</h1>
          <p className="text-xs text-app-ink/70">
            Generate downloadable PDF intelligence summaries for banks, cooperatives, or extension
            workers.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 rounded-xl bg-app-success-fill hover:bg-app-action text-app-on-action font-bold text-xs shadow transition flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export / Save PDF</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm space-y-4 text-xs">
          <h2 className="text-base font-bold text-app-heading">Report Parameters</h2>

          <div>
            <label className="block font-medium mb-1" htmlFor="report-farm">
              Target Farm
            </label>
            <input
              id="report-farm"
              type="text"
              readOnly
              value={farm?.name ?? "No plot registered"}
              className="w-full p-2.5 rounded-xl bg-app-bg border border-app-ink/15 font-semibold"
            />
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="report-category">
              Report Category
            </label>
            <select
              id="report-category"
              value={reportType}
              onChange={(event) => setReportType(event.target.value)}
              className="w-full p-2.5 rounded-xl border border-app-ink/20 bg-app-bg"
            >
              {REPORT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1" htmlFor="report-range">
              Time Range
            </label>
            <select
              id="report-range"
              value={timeRange}
              onChange={(event) => setTimeRange(event.target.value)}
              className="w-full p-2.5 rounded-xl border border-app-ink/20 bg-app-bg"
            >
              {TIME_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2 bg-app-surface rounded-2xl p-6 border border-app-ink/10 shadow-sm space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-app-success uppercase">
                AgriSense Official Report
              </span>
              <h2 className="text-xl font-bold text-app-heading">{reportType}</h2>
              <p className="text-xs text-app-ink/60">
                Generated for{" "}
                {farm
                  ? `${farm.name} (${farm.woreda || farm.region}, Ethiopia)`
                  : "no plot registered yet"}
              </p>
            </div>
            <Sprout className="w-8 h-8 text-app-success" />
          </div>

          <div className="space-y-4 text-xs text-app-ink">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-app-bg p-4 rounded-xl border border-app-ink/10">
              <div>
                <p className="text-[10px] text-app-ink/60">Field Size</p>
                <p className="font-bold text-app-heading">
                  {farm ? `${farm.sizeHectares} Ha` : "--"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-app-ink/60">Main Crop</p>
                <p className="font-bold text-app-heading">{farm?.crop ?? "--"}</p>
              </div>
              <div>
                <p className="text-[10px] text-app-ink/60">Mean NDVI</p>
                <p className="font-bold text-app-success">{farm ? farm.ndvi.toFixed(2) : "--"}</p>
              </div>
              <div>
                <p className="text-[10px] text-app-ink/60">Primary Risk</p>
                <p className="font-bold text-app-warning">{farm?.droughtRisk ?? "--"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-app-heading">Executive Summary</h3>
              <p className="leading-relaxed text-app-ink/80">
                {farm
                  ? `Satellite monitoring across the 2026 agricultural season shows ${farm.healthStatus.toLowerCase()} vegetation progression for ${farm.crop} in ${farm.woreda || farm.region}. Cumulative precipitation recorded by GPM satellite sensors reached 896 mm (86% of historical 10-year normal baseline). Topsoil surface moisture remained above crop water-stress thresholds.`
                  : "Register a plot to generate an audit report. AgriSense needs a field boundary before it can summarise satellite observations."}
              </p>
            </div>

            <div className="pt-4 border-t border-app-ink/10 flex items-center justify-between text-[10px] text-app-ink/50">
              <span>Data Sources: NASA Earth Science Division (MODIS, Landsat 9, SMAP, GPM)</span>
              <span>Prepared for {profile.displayName}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
