import { createFileRoute } from "@tanstack/react-router";
import { Route as OSRoute } from "./os";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maha OS" },
      { name: "description", content: "Maha OS HUD interface." },
      { property: "og:title", content: "Maha OS" },
      { property: "og:description", content: "Maha OS HUD interface." },
    ],
  }),
  component: OSRoute.options.component!,
});
