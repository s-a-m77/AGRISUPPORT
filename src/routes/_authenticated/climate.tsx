import { createFileRoute } from "@tanstack/react-router";

import { ClimateScreen } from "@/components/screens/ClimateScreen";

export const Route = createFileRoute("/_authenticated/climate")({
  head: () => ({
    meta: [
      { title: "Climate Monitoring — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Rainfall, soil moisture, temperature and drought risk for your farm.",
      },
    ],
  }),
  component: ClimateScreen,
});
