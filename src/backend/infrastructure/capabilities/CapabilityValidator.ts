import type { AgentCapabilityMap } from "./CapabilityTypes";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CapabilityValidator {
  static validate(
    capabilityMap: AgentCapabilityMap,
    availableToolNames: string[] = [],
    availableModelNames: string[] = [],
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (availableToolNames.length > 0) {
      for (const tool of capabilityMap.tools) {
        if (!availableToolNames.includes(tool.name)) {
          errors.push(`Tool '${tool.name}' is declared but not registered.`);
        }
      }
    }

    if (
      availableModelNames.length > 0 &&
      !availableModelNames.includes(capabilityMap.primaryModel.modelName)
    ) {
      errors.push(`Primary model '${capabilityMap.primaryModel.modelName}' is not available.`);
    }

    const hasVisionTools = capabilityMap.tools.some(
      (t) => t.name.includes("vision") || t.name.includes("image"),
    );
    if (hasVisionTools && !capabilityMap.inputModalities.includes("image")) {
      warnings.push(`Agent has vision/image tools but 'image' is not in inputModalities.`);
    }

    if (capabilityMap.primaryModel.contextWindowTokens < 4000) {
      warnings.push(
        `Primary model context window (${capabilityMap.primaryModel.contextWindowTokens}) is very small.`,
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}