import type { CLICommand, CLIContext, CLIConfig } from '../CLITypes';
import { CLIConfigManager } from '../CLIConfigManager';

export function createSystemCommands(context: CLIContext): CLICommand[] {
  const configManager = new CLIConfigManager();

  return [
    {
      name: 'config',
      description: 'Manage CLI configuration',
      options: [],
      action: async () => {
        context.output.text('Use "maha config:<command>" for configuration management');
        context.output.text('Commands: config:get, config:set, config:list, config:reset');
      },
    },
    {
      name: 'config:list',
      description: 'List all configuration values',
      options: [],
      action: async () => {
        context.output.json(configManager.getConfig());
      },
    },
    {
      name: 'config:get',
      description: 'Get a configuration value',
      options: [{ flags: '--key <key>', description: 'Configuration key', required: true }],
      action: async (_args, options) => {
        const value = configManager.get(options.key as keyof CLIConfig);
        context.output.text(`${options.key}: ${JSON.stringify(value)}`);
      },
    },
    {
      name: 'config:set',
      description: 'Set a configuration value',
      options: [
        { flags: '--key <key>', description: 'Configuration key', required: true },
        { flags: '--value <value>', description: 'Configuration value', required: true },
      ],
      action: async (_args, options) => {
        configManager.set(options.key as keyof CLIConfig, options.value as never);
        context.output.success(`Configuration updated: ${options.key}`);
      },
    },
    {
      name: 'config:reset',
      description: 'Reset configuration to defaults',
      options: [],
      action: async () => {
        configManager.resetConfig();
        context.output.success('Configuration reset to defaults');
      },
    },
    {
      name: 'health',
      description: 'Check system health',
      options: [],
      action: async () => {
        const spinner = context.output.spinner('Checking system health...');
        spinner.start();
        try {
          const health = await context.api.get('/health');
          spinner.succeed('System is healthy');
          context.output.json(health);
        } catch (error: any) {
          spinner.fail();
          context.output.error('System health check failed', error);
        }
      },
    },
    {
      name: 'version',
      description: 'Show CLI and API versions',
      options: [],
      action: async () => {
        try {
          const info: { version: string } = await context.api.get('/version');
          context.output.json({ cli: '1.0.0', api: info.version });
        } catch (error: any) {
          context.output.text('CLI Version: 1.0.0');
          context.output.error('Could not fetch API version', error);
        }
      },
    },
  ];
}