#!/usr/bin/env node
import { CLIConfigManager } from './CLIConfigManager';
import { CLIApiClientImpl } from './CLIApiClient';
import { CLIOutputImpl } from './CLIOutput';
import { CLILoggerImpl } from './CLILogger';
import { CLICommandRegistry } from './CLICommandRegistry';
import type { CLIContext } from './CLITypes';
import { createAuthCommands } from './commands/auth';
import { createAgentCommands } from './commands/agents';
import { createWorkflowCommands } from './commands/workflows';
import { createSystemCommands } from './commands/system';

async function main() {
  const configManager = new CLIConfigManager();
  const config = configManager.getConfig();

  const context: CLIContext = {
    config,
    api: new CLIApiClientImpl(config),
    output: new CLIOutputImpl(config.outputFormat, config.colorize),
    logger: new CLILoggerImpl(config.logLevel, config.colorize),
  };

  const registry = new CLICommandRegistry(context);
  [
    ...createAuthCommands(context),
    ...createAgentCommands(context),
    ...createWorkflowCommands(context),
    ...createSystemCommands(context),
  ].forEach(cmd => registry.registerCommand(cmd));

  registry.parse(process.argv);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});