export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';
export type DataType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
export type AuthType = 'bearer' | 'api_key' | 'basic' | 'oauth2';
export type CodeLanguage = 'javascript' | 'typescript' | 'python' | 'curl' | 'go' | 'ruby' | 'php';

export interface APIServer {
  url: string;
  description?: string;
  variables?: Record<string, { default: string; description?: string; enum?: string[] }>;
}

export interface APIAuthMethod {
  type: AuthType;
  name: string;
  description: string;
  bearerFormat?: string;
  apiKeyLocation?: ParameterLocation;
  apiKeyName?: string;
  oauth2Flows?: {
    implicit?: { authorizationUrl: string; scopes: Record<string, string> };
    password?: { tokenUrl: string; scopes: Record<string, string> };
    clientCredentials?: { tokenUrl: string; scopes: Record<string, string> };
    authorizationCode?: { authorizationUrl: string; tokenUrl: string; scopes: Record<string, string> };
  };
}

export interface APISchemaProperty {
  type: DataType;
  description?: string;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
  properties?: Record<string, APISchemaProperty>;
  items?: APISchemaProperty;
  required?: string[];
  default?: any;
  nullable?: boolean;
  $ref?: string;
}

export interface APIParameter {
  name: string;
  in: ParameterLocation;
  description?: string;
  required: boolean;
  schema: APISchemaProperty;
  example?: any;
  examples?: Record<string, any>;
}

export interface APIRequestBody {
  description?: string;
  required: boolean;
  content: Record<string, { schema: APISchemaProperty; example?: any; examples?: Record<string, any> }>;
}

export interface APIResponse {
  statusCode: string;
  description: string;
  content?: Record<string, { schema: APISchemaProperty; example?: any; examples?: Record<string, any> }>;
  headers?: Record<string, { description?: string; schema: APISchemaProperty }>;
}

export interface APIEndpointSecurity {
  name: string;
  scopes?: string[];
}

export interface APIExample {
  name: string;
  description?: string;
  request?: { headers?: Record<string, string>; parameters?: Record<string, any>; body?: any };
  response?: { statusCode: string; headers?: Record<string, string>; body?: any };
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: HttpMethod;
  summary: string;
  description?: string;
  tags: string[];
  parameters: APIParameter[];
  requestBody?: APIRequestBody;
  responses: APIResponse[];
  security?: APIEndpointSecurity[];
  deprecated?: boolean;
  rateLimit?: { requests: number; period: string };
  examples?: APIExample[];
  createdAt: Date;
  updatedAt: Date;
}

export interface APISchema {
  id: string;
  name: string;
  description?: string;
  type: DataType;
  properties?: Record<string, APISchemaProperty>;
  required?: string[];
  items?: APISchemaProperty;
  example?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface APIDocumentation {
  id: string;
  tenantId: string;
  title: string;
  version: string;
  description: string;
  servers: APIServer[];
  authMethods: APIAuthMethod[];
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  tags: string[];
  externalDocs?: { url: string; description?: string };
  createdAt: Date;
  updatedAt: Date;
}

export interface CodeExample {
  language: CodeLanguage;
  code: string;
  description?: string;
  dependencies?: string[];
}

export interface APIDocumentationVersion {
  id: string;
  docId: string;
  version: string;
  documentation: APIDocumentation;
  isLatest: boolean;
  publishedAt: Date;
  createdAt: Date;
}