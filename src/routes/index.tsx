import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgriSense Ethiopia — Climate-smart farm intelligence" },
      {
        name: "description",
        content:
          "Satellite, climate and AI advisory insights for Ethiopian farms. Create an account to register your plots and follow crop health every week.",
      },
      { property: "og:title", content: "AgriSense Ethiopia — Climate-smart farm intelligence" },
      {
        property: "og:description",
        content:
          "Register your plots, follow crop health from NASA satellite observations, and get AI agronomist advice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
