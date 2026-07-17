export type PluginType = 'tool' | 'integration' | 'workflow' | 'ui_extension' | 'data_connector' | 'custom';
export type PluginStatus = 'installed' | 'active' | 'inactive' | 'error' | 'uninstalled';
export type PermissionLevel = 'read' | 'write' | 'admin' | 'none';
export type HookType = 'before' | 'after' | 'around' | 'filter';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  category: string;
  tags: string[];
  minOSVersion: string;
  dependencies: PluginDependency[];
  permissions: PluginPermission[];
  main: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  configSchema?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PluginDependency {
  id: string;
  name: string;
  version: string;
  required: boolean;
}

export interface PluginPermission {
  resource: string;
  level: PermissionLevel;
  description: string;
}

export interface PluginConfig {
  pluginId: string;
  tenantId: string;
  settings: Record<string, any>;
  isActive: boolean;
  installedAt: Date;
  lastActivatedAt?: Date;
  lastDeactivatedAt?: Date;
}

export interface PluginContext {
  pluginId: string;
  tenantId: string;
  userId: string;
  api: PluginAPI;
  events: PluginEventSystem;
  hooks: PluginHookSystem;
  storage: PluginStorage;
  logger: PluginLogger;
  config: Record<string, any>;
}

interface CrudAPI {
  list(filters?: any): Promise<any[]>;
  get(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
}

export interface PluginAPI {
  contacts: CrudAPI;
  deals: CrudAPI;
  projects: CrudAPI;
  tasks: CrudAPI;
  tools: {
    register(tool: PluginTool): Promise<void>;
    unregister(toolId: string): Promise<void>;
    execute(toolId: string, args: any): Promise<any>;
  };
  notifications: {
    send(userId: string, message: string, metadata?: any): Promise<void>;
    broadcast(message: string, metadata?: any): Promise<void>;
  };
  webhooks: {
    register(endpoint: string, events: string[]): Promise<string>;
    unregister(webhookId: string): Promise<void>;
  };
}

export interface PluginTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any, context: PluginContext) => Promise<any>;
}

export type PluginEventHandler = (data: any) => void;

export interface PluginEventSystem {
  on(event: string, handler: PluginEventHandler): void;
  off(event: string, handler: PluginEventHandler): void;
  emit(event: string, data: any): void;
  once(event: string, handler: PluginEventHandler): void;
}

export type PluginHookHandler = (data: any, next?: () => any) => any;

export interface PluginHookSystem {
  register(hookName: string, handler: PluginHookHandler, type?: HookType): void;
  unregister(hookName: string, handler: PluginHookHandler): void;
  execute(hookName: string, data: any): Promise<any>;
}

export interface PluginStorage {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

export interface PluginLogger {
  info(message: string, metadata?: any): void;
  warn(message: string, metadata?: any): void;
  error(message: string, metadata?: any): void;
  debug(message: string, metadata?: any): void;
}

export interface PluginLifecycle {
  onInstall?(context: PluginContext): Promise<void>;
  onActivate?(context: PluginContext): Promise<void>;
  onDeactivate?(context: PluginContext): Promise<void>;
  onUninstall?(context: PluginContext): Promise<void>;
  onUpdate?(context: PluginContext, previousVersion: string): Promise<void>;
}

export interface PluginWebhook {
  id: string;
  pluginId: string;
  tenantId: string;
  endpoint: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
}