// src/cli/CLICommandRegistry.ts
import { Command } from 'commander';
import { CLICommand, CLIContext } from './CLITypes';

export class CLICommandRegistry {
  private program: Command;
  private context: CLIContext;

  constructor(context: CLIContext) {
    this.context = context;
    this.program = new Command();
    
    this.program
      .name('maha')
      .description('Maha OS Command Line Interface')
      .version('1.0.0');
  }

  /**
   * Registers a command
   */
  registerCommand(command: CLICommand): void {
    const cmd = this.program
      .command(command.name)
      .description(command.description);

    if (command.aliases) {
      cmd.aliases(command.aliases);
    }

    for (const option of command.options) {
      cmd.option(option.flags, option.description, option.defaultValue);
    }

    cmd.action(async (...args) => {
      try {
        const options = args[args.length - 1];
        await command.action(args.slice(0, -1), options);
      } catch (error: any) {
        this.context.output.error(error.message, error);
        process.exit(1);
      }
    });
  }

  /**
   * Parses command line arguments
   */
  parse(argv: string[]): void {
    this.program.parse(argv);
  }

  /**
   * Gets program instance
   */
  getProgram(): Command {
    return this.program;
  }
}