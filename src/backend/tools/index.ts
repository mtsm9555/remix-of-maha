// src/backend/tools/index.ts
export * from "./types";
export * from "./ToolRegistry";
export * from "./ToolRouter";
export * from "./ToolExecutor";

import { globalToolRegistry } from "./ToolRegistry";
import { WebSearchTool } from "./builtins/WebSearchTool";
import { BrowserScrapeTool } from "./builtins/BrowserScrapeTool";
import { CodeExecutionTool } from "./builtins/CodeExecutionTool";
import { CalculatorTool } from "./builtins/CalculatorTool";
import { FileReadTool } from "./builtins/FileReadTool";
import { FileWriteTool } from "./builtins/FileWriteTool";
import { ShellCommandTool } from "./builtins/ShellCommandTool";
import { HttpRequestTool } from "./builtins/HttpRequestTool";

// Register built-in tools on module load
for (const t of [
  WebSearchTool,
  BrowserScrapeTool,
  CodeExecutionTool,
  CalculatorTool,
  FileReadTool,
  FileWriteTool,
  ShellCommandTool,
  HttpRequestTool,
]) {
  if (!globalToolRegistry.has(t.name)) globalToolRegistry.register(t);
}

export {
  WebSearchTool,
  BrowserScrapeTool,
  CodeExecutionTool,
  CalculatorTool,
  FileReadTool,
  FileWriteTool,
  ShellCommandTool,
  HttpRequestTool,
};
