// src/cli/CLIOutput.ts
import chalk from 'chalk';
import Table from 'cli-table3';
import yaml from 'js-yaml';
import ora from 'ora';
import { CLIOutput, CLISpinner, OutputFormat } from './CLITypes';

export class CLIOutputImpl implements CLIOutput {
  private format: OutputFormat;
  private colorize: boolean;

  constructor(format: OutputFormat = 'table', colorize: boolean = true) {
    this.format = format;
    this.colorize = colorize;
  }

  /**
   * Outputs success message
   */
  success(message: string, data?: any): void {
    if (this.colorize) {
      console.log(chalk.green('✓'), message);
    } else {
      console.log('✓', message);
    }
    
    if (data) {
      this.outputData(data);
    }
  }

  /**
   * Outputs error message
   */
  error(message: string, error?: any): void {
    if (this.colorize) {
      console.error(chalk.red('✗'), message);
    } else {
      console.error('✗', message);
    }
    
    if (error) {
      if (error instanceof Error) {
        console.error(chalk.gray(error.message));
      } else {
        console.error(chalk.gray(JSON.stringify(error, null, 2)));
      }
    }
  }

  /**
   * Outputs data as table
   */
  table(data: any[], columns: string[]): void {
    if (data.length === 0) {
      console.log('No data to display');
      return;
    }

    const table = new Table({
      head: columns.map(col => this.colorize ? chalk.cyan(col) : col),
      style: {
        head: [],
        border: []
      }
    });

    for (const row of data) {
      table.push(columns.map(col => row[col] || ''));
    }

    console.log(table.toString());
  }

  /**
   * Outputs data as JSON
   */
  json(data: any): void {
    console.log(JSON.stringify(data, null, 2));
  }

  /**
   * Outputs data as YAML
   */
  yaml(data: any): void {
    console.log(yaml.dump(data));
  }

  /**
   * Outputs plain text
   */
  text(message: string): void {
    console.log(message);
  }

  /**
   * Creates spinner
   */
  spinner(message: string): CLISpinner {
    const instance = ora({
      text: message,
      color: 'cyan'
    });
    return {
      start: () => { instance.start(); },
      stop: () => { instance.stop(); },
      succeed: (msg?: string) => { instance.succeed(msg); },
      fail: (msg?: string) => { instance.fail(msg); },
      update: (msg: string) => { instance.text = msg; },
    };
  }

  /**
   * Outputs data based on format
   */
  private outputData(data: any): void {
    switch (this.format) {
      case 'json':
        this.json(data);
        break;
      case 'yaml':
        this.yaml(data);
        break;
      case 'text':
        this.text(JSON.stringify(data));
        break;
      default:
        if (Array.isArray(data)) {
          const columns = Object.keys(data[0] || {});
          this.table(data, columns);
        } else {
          this.json(data);
        }
    }
  }
}