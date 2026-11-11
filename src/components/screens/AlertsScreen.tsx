import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

import { alertsQueryOptions, useMarkAlertRead } from "@/lib/queries";

const CATEGORIES = ["All", "Soil Moisture", "Crop Maturation", "Temperature"];

export function AlertsScreen() {
  const { data: alerts } = useSuspenseQuery(alertsQueryOptions());
  const markRead = useMarkAlertRead();
  const [filterCategory, setFilterCategory] = useState("All");

  const visible =
    filterCategory === "All" ? alerts : alerts.filter((alert) => alert.category === filterCategory);

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-app-surface rounded-2xl p-5 border border-app-ink/10 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-app-heading">Agricultural Warning Center</h1>
          <p className="text-xs text-app-ink/70">
            Automated risk warnings triggered by satellite telemetry thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-app-bg p-1 rounded-xl text-xs">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterCategory === category ? "bg-app-action text-app-on-action" : "text-app-ink/70"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visible.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-app-ink/20 bg-app-surface text-center space-y-2">
            <AlertTriangle className="w-6 h-6 text-app-success mx-auto" />
            <p className="text-sm font-semibold text-app-heading">No warnings in this category</p>
            <p className="text-xs text-app-ink/70">
              New satellite warnings appear here as soon as a threshold is crossed.
            </p>
          </div>
        ) : (
          visible.map((alert) => (
            <div
              key={alert.id}
              className={`p-5 rounded-2xl border transition space-y-3 ${
                alert.read
                  ? "bg-app-surface border-app-ink/10 opacity-75"
                  : "bg-app-surface border-app-danger/40 shadow-sm ring-1 ring-app-danger/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl text-app-on-action font-bold ${
                      alert.severity === "High"
                        ? "bg-app-danger"
                        : alert.severity === "Medium"
                          ? "bg-app-gold"
                          : "bg-app-success-fill"
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-app-heading text-base">{alert.title}</h3>
                    <p className="text-xs text-app-ink/70">
                      Affected Field: <strong className="text-app-success">{alert.farmName}</strong>{" "}
                      • {alert.occurredOn}
                    </p>
                  </div>
                </div>

                {!alert.read && (
                  <button
                    onClick={() =>
                      markRead.mutate(alert.id, {
                        onSuccess: () => toast("Alert marked as read"),
                        onError: (error) => toast.error(error.message),
                      })
                    }
                    disabled={markRead.isPending}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-app-soft text-app-success hover:bg-app-success-fill hover:text-app-on-action transition disabled:opacity-60"
                  >
                    Mark as Read
                  </button>
                )}
              </div>

              <div className="p-3 bg-app-bg rounded-xl text-xs space-y-1.5">
                <p className="text-app-ink">
                  <strong>Satellite Evidence:</strong> {alert.evidence}
                </p>
                <p className="text-app-heading font-semibold">
                  <strong>Recommended Action:</strong> {alert.recommendation}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
