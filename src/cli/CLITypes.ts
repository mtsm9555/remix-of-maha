// src/cli/CLITypes.ts

export type OutputFormat = 'json' | 'table' | 'yaml' | 'text';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface CLIConfig {
  apiUrl: string;
  apiKey?: string;
  tenantId?: string;
  workspaceId?: string;
  outputFormat: OutputFormat;
  logLevel: LogLevel;
  colorize: boolean;
}

export interface CLICommand {
  name: string;
  description: string;
  aliases?: string[];
  options: CLIOption[];
  action: (args: any, options: any) => Promise<void>;
}

export interface CLIOption {
  flags: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
}

export interface CLIContext {
  config: CLIConfig;
  api: CLIApiClient;
  output: CLIOutput;
  logger: CLILogger;
}

export interface CLIApiClient {
  request(method: string, path: string, data?: any): Promise<any>;
  get(path: string): Promise<any>;
  post(path: string, data?: any): Promise<any>;
  put(path: string, data?: any): Promise<any>;
  delete(path: string): Promise<any>;
}

export interface CLIOutput {
  success(message: string, data?: any): void;
  error(message: string, error?: any): void;
  table(data: any[], columns: string[]): void;
  json(data: any): void;
  yaml(data: any): void;
  text(message: string): void;
  spinner(message: string): CLISpinner;
}

export interface CLISpinner {
  start(): void;
  stop(): void;
  succeed(message?: string): void;
  fail(message?: string): void;
  update(message: string): void;
}

export interface CLILogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}