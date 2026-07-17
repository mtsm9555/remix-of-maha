// src/cli/commands/agents.ts
import { CLICommand, CLIContext } from '../CLITypes';

export function createAgentCommands(context: CLIContext): CLICommand[] {
  return [
    {
      name: 'agents',
      description: 'Manage AI agents',
      options: [],
      action: async () => {
        context.output.text('Use "maha agents <command>" for agent management');
        context.output.text('Commands: list, create, deploy, status, logs');
      }
    },
    {
      name: 'agents:list',
      description: 'List all registered agents',
      options: [
        { flags: '--status <status>', description: 'Filter by status' },
        { flags: '--format <format>', description: 'Output format (json|table|yaml)' }
      ],
      action: async (args, options) => {
        const spinner = context.output.spinner('Fetching agents...');
        spinner.start();

        try {
          const agents = await context.api.get('/agents');
          
          spinner.stop();
          
          let filtered = agents;
          if (options.status) {
            filtered = agents.filter((a: any) => a.status === options.status);
          }

          if (options.format === 'json') {
            context.output.json(filtered);
          } else {
            context.output.table(filtered, ['id', 'name', 'type', 'status', 'tasksCompleted']);
          }
        } catch (error: any) {
          spinner.fail();
          context.output.error('Failed to fetch agents', error);
        }
      }
    },
    {
      name: 'agents:create',
      description: 'Create a new agent',
      options: [
        { flags: '--name <name>', description: 'Agent name', required: true },
        { flags: '--type <type>', description: 'Agent type', required: true },
        { flags: '--description <desc>', description: 'Agent description' }
      ],
      action: async (args, options) => {
        const spinner = context.output.spinner('Creating agent...');
        spinner.start();

        try {
          const agent = await context.api.post('/agents', {
            name: options.name,
            type: options.type,
            description: options.description
          });

          spinner.succeed(`Agent created: ${agent.id}`);
          context.output.json(agent);
        } catch (error: any) {
          spinner.fail();
          context.output.error('Failed to create agent', error);
        }
      }
    },
    {
      name: 'agents:deploy',
      description: 'Deploy an agent',
      options: [
        { flags: '--id <id>', description: 'Agent ID', required: true }
      ],
      action: async (args, options) => {
        const spinner = context.output.spinner('Deploying agent...');
        spinner.start();

        try {
          await context.api.post(`/agents/${options.id}/deploy`);
          spinner.succeed(`Agent deployed: ${options.id}`);
        } catch (error: any) {
          spinner.fail();
          context.output.error('Failed to deploy agent', error);
        }
      }
    },
    {
      name: 'agents:status',
      description: 'Get agent status',
      options: [
        { flags: '--id <id>', description: 'Agent ID', required: true }
      ],
      action: async (args, options) => {
        try {
          const agent = await context.api.get(`/agents/${options.id}`);
          context.output.json(agent);
        } catch (error: any) {
          context.output.error('Failed to get agent status', error);
        }
      }
    },
    {
      name: 'agents:logs',
      description: 'View agent logs',
      options: [
        { flags: '--id <id>', description: 'Agent ID', required: true },
        { flags: '--lines <n>', description: 'Number of lines', defaultValue: '50' }
      ],
      action: async (args, options) => {
        try {
          const logs = await context.api.get(`/agents/${options.id}/logs?limit=${options.lines}`);
          
          for (const log of logs) {
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            const level = log.level.toUpperCase().padEnd(5);
            context.output.text(`[${timestamp}] ${level} ${log.message}`);
          }
        } catch (error: any) {
          context.output.error('Failed to fetch logs', error);
        }
      }
    }
  ];
}