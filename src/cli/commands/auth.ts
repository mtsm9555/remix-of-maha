// src/cli/commands/auth.ts
import { CLICommand, CLIContext } from '../CLITypes';
import { CLIConfigManager } from '../CLIConfigManager';

export function createAuthCommands(context: CLIContext): CLICommand[] {
  const configManager = new CLIConfigManager();

  return [
    {
      name: 'login',
      description: 'Authenticate with Maha OS',
      options: [
        { flags: '--api-key <key>', description: 'API key for authentication' },
        { flags: '--tenant <id>', description: 'Tenant ID' }
      ],
      action: async (args, options) => {
        if (!options.apiKey) {
          context.output.error('API key is required. Use --api-key <key>');
          return;
        }

        configManager.set('apiKey', options.apiKey);
        
        if (options.tenant) {
          configManager.set('tenantId', options.tenant);
        }

        context.output.success('Successfully authenticated with Maha OS');
      }
    },
    {
      name: 'logout',
      description: 'Clear authentication credentials',
      options: [],
      action: async () => {
        configManager.set('apiKey', undefined);
        configManager.set('tenantId', undefined);
        context.output.success('Successfully logged out');
      }
    },
    {
      name: 'whoami',
      description: 'Show current authentication status',
      options: [],
      action: async () => {
        const config = configManager.getConfig();
        
        if (!config.apiKey) {
          context.output.error('Not authenticated. Use "maha login" to authenticate.');
          return;
        }

        context.output.success('Authenticated', {
          apiUrl: config.apiUrl,
          tenantId: config.tenantId || 'Not set',
          apiKey: config.apiKey.substring(0, 8) + '...'
        });
      }
    }
  ];
}