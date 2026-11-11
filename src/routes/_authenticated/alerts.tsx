import { createFileRoute } from "@tanstack/react-router";

import { AlertsScreen } from "@/components/screens/AlertsScreen";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Satellite warnings for your plots, with the action to take.",
      },
    ],
  }),
  component: AlertsScreen,
});
