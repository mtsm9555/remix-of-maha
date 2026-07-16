import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeMarketingTools() {
  console.log("[Marketing] Registering Marketing Tools & Permissions...");

  if (!globalToolRegistry.has("publish_blog_post")) {
    globalToolRegistry.register({
      name: "publish_blog_post",
      description: "Publishes a formatted article to the company CMS (WordPress/Ghost).",
      parameters: z.object({
        title: z.string(),
        content: z.string(),
        tags: z.array(z.string()),
        seoMetaDescription: z.string(),
      }),
      execute: async (args) => {
        const start = Date.now();
        console.log(`[Marketing Tool] Publishing blog: "${args.title}"`);
        return ok(
          {
            url: `https://blog.company.com/${args.title.toLowerCase().replace(/\s/g, "-")}`,
          },
          start,
        );
      },
    });
  }

  if (!globalToolRegistry.has("run_seo_audit")) {
    globalToolRegistry.register({
      name: "run_seo_audit",
      description: "Analyzes a URL for SEO performance, page speed, and keyword density.",
      parameters: z.object({ url: z.string().url() }),
      execute: async () => {
        const start = Date.now();
        return ok({ score: 85, issues: ["Missing H1 tag", "Slow LCP"] }, start);
      },
    });
  }

  if (!globalToolRegistry.has("launch_ad_campaign")) {
    globalToolRegistry.register({
      name: "launch_ad_campaign",
      description: "Creates and launches a paid ad campaign on Meta/Google/LinkedIn.",
      parameters: z.object({
        platform: z.enum(["meta", "google", "linkedin"]),
        budgetUSD: z.number(),
        targetAudience: z.string(),
        adCopy: z.string(),
      }),
      execute: async () => {
        const start = Date.now();
        return ok({ campaignId: "camp_12345", status: "review" }, start);
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "mkt_publish",
    toolName: "publish_blog_post",
    allowedDepartments: ["marketing", "sales"],
    level: "require_approval",
    description: "Publishing content requires human editorial approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "mkt_ads_spend",
    toolName: "launch_ad_campaign",
    allowedDepartments: ["marketing"],
    level: "require_approval",
    parameterConstraints: [{ field: "budgetUSD", operator: "max_value", value: 5000 }],
    description: "Ad campaigns over $5,000 require CFO/CMO approval.",
  });
}