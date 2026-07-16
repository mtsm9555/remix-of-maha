// src/backend/auth/types.ts

export type UserRole = "admin" | "user" | "guest";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  preferences?: Record<string, any>;
}

export interface AuthContext {
  userId: string;
  sessionId: string;
  role: UserRole;
  permissions: string[];
}

export interface Permission {
  resource: string;
  action: string;
  target?: string;
}

export interface PermissionPolicy {
  id: string;
  role: UserRole;
  permissions: Permission[];
  description: string;
}