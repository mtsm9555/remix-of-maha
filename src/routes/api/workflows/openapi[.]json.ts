// OpenAPI 3.1 spec for the workflow REST API.
// Served at GET /api/workflows/openapi.json
import { createFileRoute } from "@tanstack/react-router";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Maha Workflow API",
    version: "1.0.0",
    description:
      "REST endpoints for creating, listing, retrieving, and triggering workflows, and for polling workflow run status. All endpoints require an Authorization: Bearer <supabase-access-token> header. Access is scoped to the authenticated user by Row-Level Security.",
  },
  servers: [{ url: "/", description: "Same-origin" }],
  security: [{ bearerAuth: [] }],
  tags: [
    { name: "Workflows", description: "Workflow definitions" },
    { name: "Runs", description: "Workflow executions" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: { type: "string" },
          details: { type: "object", additionalProperties: true },
        },
      },
      NodeType: {
        type: "string",
        enum: ["agent_task", "tool_call", "llm_prompt", "condition", "memory_save"],
      },
      WorkflowNode: {
        type: "object",
        required: ["id", "name", "type"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { $ref: "#/components/schemas/NodeType" },
          config: { type: "object", additionalProperties: true, default: {} },
        },
      },
      WorkflowEdge: {
        type: "object",
        required: ["source", "target"],
        properties: {
          source: { type: "string", description: "Source node id" },
          target: { type: "string", description: "Target node id" },
        },
      },
      WorkflowSummary: {
        type: "object",
        required: ["id", "name", "created_at", "updated_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      Workflow: {
        type: "object",
        required: ["id", "user_id", "name", "nodes_json", "edges_json", "created_at", "updated_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          nodes_json: { type: "array", items: { $ref: "#/components/schemas/WorkflowNode" } },
          edges_json: { type: "array", items: { $ref: "#/components/schemas/WorkflowEdge" } },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      CreateWorkflowRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 200 },
          description: { type: "string", maxLength: 2000 },
          nodes: { type: "array", items: { $ref: "#/components/schemas/WorkflowNode" }, default: [] },
          edges: { type: "array", items: { $ref: "#/components/schemas/WorkflowEdge" }, default: [] },
        },
      },
      TriggerWorkflowRequest: {
        type: "object",
        description: "Arbitrary input payload passed to the workflow's root nodes.",
        additionalProperties: true,
      },
      TriggerWorkflowResponse: {
        type: "object",
        required: ["success", "runId", "outputs"],
        properties: {
          success: { type: "boolean" },
          runId: { type: "string", format: "uuid" },
          outputs: {
            type: "object",
            description: "Map of node id → node output.",
            additionalProperties: true,
          },
        },
      },
      RunStatus: {
        type: "string",
        enum: ["pending", "running", "completed", "failed"],
      },
      WorkflowRunSummary: {
        type: "object",
        required: ["id", "status", "started_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          status: { $ref: "#/components/schemas/RunStatus" },
          started_at: { type: "string", format: "date-time" },
          completed_at: { type: "string", format: "date-time", nullable: true },
          error: { type: "string", nullable: true },
        },
      },
      WorkflowRun: {
        type: "object",
        required: ["id", "workflow_id", "user_id", "status", "started_at"],
        properties: {
          id: { type: "string", format: "uuid" },
          workflow_id: { type: "string", format: "uuid" },
          user_id: { type: "string", format: "uuid" },
          status: { $ref: "#/components/schemas/RunStatus" },
          input: { nullable: true },
          node_outputs: { type: "object", additionalProperties: true },
          error: { type: "string", nullable: true },
          started_at: { type: "string", format: "date-time" },
          completed_at: { type: "string", format: "date-time", nullable: true },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid bearer token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      BadRequest: {
        description: "Invalid request payload",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  paths: {
    "/api/workflows": {
      get: {
        tags: ["Workflows"],
        summary: "List the caller's workflows",
        responses: {
          "200": {
            description: "Array of workflow summaries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["workflows"],
                  properties: {
                    workflows: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WorkflowSummary" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Workflows"],
        summary: "Create a workflow",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateWorkflowRequest" } },
          },
        },
        responses: {
          "201": {
            description: "Workflow created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["workflow"],
                  properties: { workflow: { $ref: "#/components/schemas/Workflow" } },
                },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/workflows/{id}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: {
        tags: ["Workflows"],
        summary: "Get a workflow definition",
        responses: {
          "200": {
            description: "Workflow definition",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["workflow"],
                  properties: { workflow: { $ref: "#/components/schemas/Workflow" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
    "/api/workflows/{id}/trigger": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      post: {
        tags: ["Runs"],
        summary: "Trigger a workflow run",
        description:
          "Runs the workflow synchronously and returns the run id and per-node outputs. Blocks until execution completes.",
        requestBody: {
          required: false,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TriggerWorkflowRequest" } },
          },
        },
        responses: {
          "202": {
            description: "Run completed (returned inline)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TriggerWorkflowResponse" },
              },
            },
          },
          "400": { $ref: "#/components/responses/BadRequest" },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
          "500": {
            description: "Workflow execution failed",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
          },
        },
      },
    },
    "/api/workflows/{id}/runs": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: {
        tags: ["Runs"],
        summary: "List recent runs for a workflow (max 50, newest first)",
        responses: {
          "200": {
            description: "Array of run summaries",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["runs"],
                  properties: {
                    runs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/WorkflowRunSummary" },
                    },
                  },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/workflows/runs/{runId}": {
      parameters: [
        { name: "runId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      get: {
        tags: ["Runs"],
        summary: "Get a workflow run's full status",
        responses: {
          "200": {
            description: "Run detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["run"],
                  properties: { run: { $ref: "#/components/schemas/WorkflowRun" } },
                },
              },
            },
          },
          "401": { $ref: "#/components/responses/Unauthorized" },
          "404": { $ref: "#/components/responses/NotFound" },
        },
      },
    },
  },
} as const;

export const Route = createFileRoute("/api/workflows/openapi.json")({
  server: {
    handlers: {
      GET: async () =>
        new Response(JSON.stringify(spec, null, 2), {
          headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        }),
    },
  },
});