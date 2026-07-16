import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeDesignTools() {
  console.log("[Design] Registering Design Tools & Strict Permissions...");

  if (!globalToolRegistry.has("generate_ai_image")) {
    globalToolRegistry.register({
      name: "generate_ai_image",
      description:
        "Generates high-quality images using AI models (Midjourney/DALL-E) based on a prompt.",
      parameters: z.object({
        prompt: z.string(),
        model: z.enum(["dall-e-3", "midjourney-v6"]),
        resolution: z.enum(["1024x1024", "1792x1024"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok(
          { imageUrl: "https://cdn.company.com/ai_img_123.png", costUSD: 0.04 },
          s,
        );
      },
    });
  }

  if (!globalToolRegistry.has("generate_ui_component_code")) {
    globalToolRegistry.register({
      name: "generate_ui_component_code",
      description:
        "Generates production-ready React/Tailwind code for a UI component based on a design spec.",
      parameters: z.object({
        componentName: z.string(),
        designSpec: z.string(),
        framework: z.enum(["react", "vue", "svelte"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ code: "export const Button = () => <button>...</button>" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("publish_brand_asset")) {
    globalToolRegistry.register({
      name: "publish_brand_asset",
      description:
        "Uploads and publishes a final asset (logo, icon, banner) to the central Brand CDN.",
      parameters: z.object({
        assetName: z.string(),
        category: z.enum(["logo", "icon", "banner", "social"]),
        fileUrl: z.string().url(),
      }),
      execute: async (args) => {
        const s = Date.now();
        return ok(
          { cdnUrl: `https://brand.company.com/${args.category}/${args.assetName}` },
          s,
        );
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "design_ai_image_budget",
    toolName: "generate_ai_image",
    allowedDepartments: ["design", "marketing"],
    level: "require_approval",
    parameterConstraints: [
      { field: "model", operator: "eq", value: "midjourney-v6" },
      { field: "resolution", operator: "eq", value: "1792x1024" },
    ],
    description:
      "Generating high-res Midjourney images requires approval due to higher API costs.",
  });

  DepartmentToolPermissions.addRule({
    id: "design_protect_brand_assets",
    toolName: "publish_brand_asset",
    allowedDepartments: ["design"],
    level: "require_approval",
    parameterConstraints: [
      { field: "category", operator: "in", value: ["logo", "icon"] },
    ],
    description:
      "Publishing core brand identity assets (logos/icons) ALWAYS requires Art Director approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "design_code_frameworks",
    toolName: "generate_ui_component_code",
    allowedDepartments: ["design", "development"],
    level: "deny",
    parameterConstraints: [
      { field: "framework", operator: "not_equals", value: "react" },
    ],
    description:
      "UI code generation is restricted to the company standard (React). Other frameworks are blocked.",
  });
}