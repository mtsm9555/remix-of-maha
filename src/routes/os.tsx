import { createFileRoute } from "@tanstack/react-router";
import OSPage from "@/components/OSPage";

export const Route = createFileRoute("/os")({
  head: () => ({
    meta: [
      { title: "MAHA — AI Operating System" },
      { name: "description", content: "MAHA AI OS — voice-first neural interface." },
    ],
  }),
  component: OSPage,
});
