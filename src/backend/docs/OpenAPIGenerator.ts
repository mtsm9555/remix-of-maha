import type { APIDocumentation, APIEndpoint, APISchema } from "./APIDocumentationTypes";

export class OpenAPIGenerator {
  static generateSpec(documentation: APIDocumentation): any {
    const spec: any = {
      openapi: '3.0.3',
      info: { title: documentation.title, version: documentation.version, description: documentation.description },
      servers: documentation.servers.map(s => ({ url: s.url, description: s.description, variables: s.variables })),
      paths: {},
      components: { schemas: {}, securitySchemes: {} },
      tags: documentation.tags.map(tag => ({ name: tag })),
      externalDocs: documentation.externalDocs,
    };

    for (const endpoint of documentation.endpoints) {
      const path = endpoint.path;
      const method = endpoint.method.toLowerCase();
      if (!spec.paths[path]) spec.paths[path] = {};
      spec.paths[path][method] = this.generateEndpointSpec(endpoint);
    }

    for (const schema of documentation.schemas) {
      spec.components.schemas[schema.name] = this.generateSchemaSpec(schema);
    }

    for (const auth of documentation.authMethods) {
      spec.components.securitySchemes[auth.name] = this.generateSecurityScheme(auth);
    }

    return spec;
  }

  private static generateEndpointSpec(endpoint: APIEndpoint): any {
    const spec: any = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters.map(p => ({
        name: p.name,
        in: p.in,
        description: p.description,
        required: p.required,
        schema: this.generateSchemaPropertySpec(p.schema),
        example: p.example,
        examples: p.examples,
      })),
      responses: {},
    };

    if (endpoint.requestBody) {
      spec.requestBody = {
        description: endpoint.requestBody.description,
        required: endpoint.requestBody.required,
        content: {},
      };
      for (const [contentType, content] of Object.entries(endpoint.requestBody.content)) {
        spec.requestBody.content[contentType] = {
          schema: this.generateSchemaPropertySpec(content.schema),
          example: content.example,
          examples: content.examples,
        };
      }
    }

    for (const response of endpoint.responses) {
      spec.responses[response.statusCode] = {
        description: response.description,
        content: {},
        headers: response.headers,
      };
      if (response.content) {
        for (const [contentType, content] of Object.entries(response.content)) {
          spec.responses[response.statusCode].content[contentType] = {
            schema: this.generateSchemaPropertySpec(content.schema),
            example: content.example,
            examples: content.examples,
          };
        }
      }
    }

    if (endpoint.security) {
      spec.security = endpoint.security.map(s => ({ [s.name]: s.scopes || [] }));
    }

    if (endpoint.deprecated) spec.deprecated = true;
    return spec;
  }

  private static generateSchemaSpec(schema: APISchema): any {
    const spec: any = { type: schema.type, description: schema.description, example: schema.example };
    if (schema.properties) {
      spec.properties = {};
      for (const [n, p] of Object.entries(schema.properties)) spec.properties[n] = this.generateSchemaPropertySpec(p);
    }
    if (schema.required) spec.required = schema.required;
    if (schema.items) spec.items = this.generateSchemaPropertySpec(schema.items);
    return spec;
  }

  private static generateSchemaPropertySpec(property: any): any {
    const spec: any = {
      type: property.type,
      description: property.description,
      format: property.format,
      default: property.default,
      nullable: property.nullable,
    };
    if (property.minimum !== undefined) spec.minimum = property.minimum;
    if (property.maximum !== undefined) spec.maximum = property.maximum;
    if (property.minLength !== undefined) spec.minLength = property.minLength;
    if (property.maxLength !== undefined) spec.maxLength = property.maxLength;
    if (property.pattern) spec.pattern = property.pattern;
    if (property.enum) spec.enum = property.enum;
    if (property.properties) {
      spec.properties = {};
      for (const [n, p] of Object.entries(property.properties)) spec.properties[n] = this.generateSchemaPropertySpec(p);
    }
    if (property.items) spec.items = this.generateSchemaPropertySpec(property.items);
    if (property.required) spec.required = property.required;
    if (property.$ref) spec.$ref = property.$ref;
    return Object.fromEntries(Object.entries(spec).filter(([_, v]) => v !== undefined));
  }

  private static generateSecurityScheme(auth: any): any {
    const scheme: any = { type: auth.type, description: auth.description };
    switch (auth.type) {
      case 'bearer':
      case 'http':
        scheme.type = 'http';
        scheme.scheme = 'bearer';
        scheme.bearerFormat = auth.bearerFormat || 'JWT';
        break;
      case 'api_key':
      case 'apiKey':
        scheme.type = 'apiKey';
        scheme.in = auth.apiKeyLocation;
        scheme.name = auth.apiKeyName;
        break;
      case 'oauth2':
        scheme.flows = auth.oauth2Flows;
        break;
    }
    return scheme;
  }

  static exportAsJSON(spec: any): string {
    return JSON.stringify(spec, null, 2);
  }

  static exportAsYAML(spec: any): string {
    return this.toYaml(spec, 0);
  }

  private static toYaml(value: any, indent: number): string {
    const pad = '  '.repeat(indent);
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return this.yamlString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return value.map(v => {
        const rendered = this.toYaml(v, indent + 1);
        if (typeof v === 'object' && v !== null) {
          const lines = rendered.split('\n');
          return `${pad}- ${lines[0].trimStart()}\n${lines.slice(1).join('\n')}`.trimEnd();
        }
        return `${pad}- ${rendered}`;
      }).join('\n');
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      return keys.map(k => {
        const v = (value as any)[k];
        if (v === undefined) return '';
        if (typeof v === 'object' && v !== null && (Array.isArray(v) ? v.length > 0 : Object.keys(v).length > 0)) {
          return `${pad}${k}:\n${this.toYaml(v, indent + 1)}`;
        }
        return `${pad}${k}: ${this.toYaml(v, indent + 1)}`;
      }).filter(Boolean).join('\n');
    }
    return String(value);
  }

  private static yamlString(s: string): string {
    if (/[:#\-?&*!|>'"%@`\n]/.test(s) || s.trim() !== s || s === '') return JSON.stringify(s);
    return s;
  }
}