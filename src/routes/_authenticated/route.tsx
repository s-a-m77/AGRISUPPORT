import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { Suspense } from "react";

import { AppShell } from "@/components/app/AppShell";
import { api } from "@/lib/api";
import { alertsQueryOptions, farmsQueryOptions, profileQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated")({
  // The session lives in browser storage, so this subtree renders client-side only.
  ssr: false,
  beforeLoad: async () => {
    const { data } = await api.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", replace: true });
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(profileQueryOptions()),
      context.queryClient.ensureQueryData(farmsQueryOptions()),
      context.queryClient.ensureQueryData(alertsQueryOptions()),
    ]);
  },
  head: () => ({
    meta: [
      { title: "AgriSense Ethiopia — Your farm dashboard" },
      {
        name: "description",
        content: "Your plots, satellite crop health, climate telemetry and agronomist advice.",
      },
    ],
  }),
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-app-bg text-app-ink text-sm">
          Loading your farm data…
        </div>
      }
    >
      <AppShell />
    </Suspense>
  );
}
