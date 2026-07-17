// src/cli/commands/workflows.ts
import { CLICommand, CLIContext } from '../CLITypes';

export function createWorkflowCommands(context: CLIContext): CLICommand[] {
  return [
    {
      name: 'workflows',
      description: 'Manage workflows',
      options: [],
      action: async () => {
        context.output.text('Use "maha workflows <command>" for workflow management');
        context.output.text('Commands: list, create, execute, status');
      }
    },
    {
      name: 'workflows:list',
      description: 'List all workflows',
      options: [
        { flags: '--status <status>', description: 'Filter by status' }
      ],
      action: async (args, options) => {
        const spinner = context.output.spinner('Fetching workflows...');
        spinner.start();

        try {
          const workflows = await context.api.get('/workflows');
          spinner.stop();

          let filtered = workflows;
          if (options.status) {
            filtered = workflows.filter((w: any) => w.status === options.status);
          }

          context.output.table(filtered, ['id', 'name', 'type', 'status', 'executions']);
        } catch (error: any) {
          spinner.fail();
          context.output.error('Failed to fetch workflows', error);
        }
      }
    },
    {
      name: 'workflows:execute',
      description: 'Execute a workflow',
      options: [
        { flags: '--id <id>', description: 'Workflow ID', required: true },
        { flags: '--input <json>', description: 'Input data as JSON' }
      ],
      action: async (args, options) => {
        const spinner = context.output.spinner('Executing workflow...');
        spinner.start();

        try {
          const input = options.input ? JSON.parse(options.input) : {};
          const execution = await context.api.post(`/workflows/${options.id}/execute`, { input });

          spinner.succeed(`Workflow execution started: ${execution.id}`);
          context.output.json(execution);
        } catch (error: any) {
          spinner.fail();
          context.output.error('Failed to execute workflow', error);
        }
      }
    },
    {
      name: 'workflows:status',
      description: 'Get workflow execution status',
      options: [
        { flags: '--execution-id <id>', description: 'Execution ID', required: true }
      ],
      action: async (args, options) => {
        try {
          const execution = await context.api.get(`/workflow-executions/${options.executionId}`);
          context.output.json(execution);
        } catch (error: any) {
          context.output.error('Failed to get execution status', error);
        }
      }
    }
  ];
}