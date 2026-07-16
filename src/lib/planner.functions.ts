import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PlannerAgent } from "@/backend/agents/PlannerAgent";

const PlannerInputSchema = z.object({ query: z.string().min(1) });

export const runPlanner = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => PlannerInputSchema.parse(input))
  .handler(async ({ data }) => {
    return PlannerAgent.handleQuery({ query: data.query });
  });