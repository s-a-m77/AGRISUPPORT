import { createFileRoute } from "@tanstack/react-router";

import { AiAdvisorScreen } from "@/components/screens/AiAdvisorScreen";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "AI Advisor — AgriSense Ethiopia" },
      {
        name: "description",
        content: "Ask the AI agronomist about your crop, drought risk and irrigation.",
      },
    ],
  }),
  component: AiAdvisorScreen,
});
