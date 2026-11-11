import { createFileRoute } from "@tanstack/react-router";

import { DashboardScreen } from "@/components/screens/DashboardScreen";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Crop health, rainfall and drought status for your active plot.",
      },
    ],
  }),
  component: DashboardScreen,
});
