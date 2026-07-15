export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export class Logger {
  log(level: LogLevel, message: string, metadata: Record<string, any> = {}) {
    console.log(
      JSON.stringify({ level, message, metadata, timestamp: new Date().toISOString() }),
    );
  }
  debug(message: string, metadata: Record<string, any> = {}) {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  info(message: string, metadata: Record<string, any> = {}) {
    this.log(LogLevel.INFO, message, metadata);
  }
  warn(message: string, metadata: Record<string, any> = {}) {
    this.log(LogLevel.WARN, message, metadata);
  }
  error(message: string, metadata: Record<string, any> = {}) {
    this.log(LogLevel.ERROR, message, metadata);
  }
}

export const logger = new Logger();