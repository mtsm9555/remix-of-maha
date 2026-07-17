// src/cli/CLIConfigManager.ts
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { CLIConfig } from './CLITypes';

export class CLIConfigManager {
  private configPath: string;
  private config: CLIConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.maha', 'config.json');
    this.config = this.loadConfig();
  }

  /**
   * Loads configuration from file
   */
  private loadConfig(): CLIConfig {
    const defaultConfig: CLIConfig = {
      apiUrl: 'http://localhost:3000',
      outputFormat: 'table',
      logLevel: 'info',
      colorize: true
    };

    try {
      if (fs.existsSync(this.configPath)) {
        const fileConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return { ...defaultConfig, ...fileConfig };
      }
    } catch (error) {
      console.warn('Failed to load config file, using defaults');
    }

    return defaultConfig;
  }

  /**
   * Saves configuration to file
   */
  saveConfig(): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  /**
   * Gets configuration value
   */
  get<K extends keyof CLIConfig>(key: K): CLIConfig[K] {
    return this.config[key];
  }

  /**
   * Sets configuration value
   */
  set<K extends keyof CLIConfig>(key: K, value: CLIConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * Gets full configuration
   */
  getConfig(): CLIConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   */
  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Resets configuration to defaults
   */
  resetConfig(): void {
    this.config = {
      apiUrl: 'http://localhost:3000',
      outputFormat: 'table',
      logLevel: 'info',
      colorize: true
    };
    this.saveConfig();
  }
}