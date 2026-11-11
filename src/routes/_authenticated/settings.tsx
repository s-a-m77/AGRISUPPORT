import { createFileRoute } from "@tanstack/react-router";

import { SettingsScreen } from "@/components/screens/SettingsScreen";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Your name, agricultural focus, language and notification channels.",
      },
    ],
  }),
  component: SettingsScreen,
});
