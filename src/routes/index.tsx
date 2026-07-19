import { createFileRoute } from "@tanstack/react-router";
import OSPage from "@/components/OSPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maha OS" },
      { name: "description", content: "Maha OS HUD interface." },
      { property: "og:title", content: "Maha OS" },
      { property: "og:description", content: "Maha OS HUD interface." },
    ],
  }),
  component: OSPage,
});
