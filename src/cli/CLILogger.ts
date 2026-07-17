// src/cli/CLILogger.ts
import chalk from 'chalk';
import { CLILogger, LogLevel } from './CLITypes';

export class CLILoggerImpl implements CLILogger {
  private level: LogLevel;
  private colorize: boolean;

  constructor(level: LogLevel = 'info', colorize: boolean = true) {
    this.level = level;
    this.colorize = colorize;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  /**
   * Logs debug message
   */
  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog('debug')) return;
    
    const prefix = this.colorize ? chalk.gray('[DEBUG]') : '[DEBUG]';
    console.log(prefix, message, ...args);
  }

  /**
   * Logs info message
   */
  info(message: string, ...args: any[]): void {
    if (!this.shouldLog('info')) return;
    
    const prefix = this.colorize ? chalk.blue('[INFO]') : '[INFO]';
    console.log(prefix, message, ...args);
  }

  /**
   * Logs warning message
   */
  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog('warn')) return;
    
    const prefix = this.colorize ? chalk.yellow('[WARN]') : '[WARN]';
    console.warn(prefix, message, ...args);
  }

  /**
   * Logs error message
   */
  error(message: string, ...args: any[]): void {
    if (!this.shouldLog('error')) return;
    
    const prefix = this.colorize ? chalk.red('[ERROR]') : '[ERROR]';
    console.error(prefix, message, ...args);
  }
}