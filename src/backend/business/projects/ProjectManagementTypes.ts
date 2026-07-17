export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectPhase = 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closure';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'task' | 'bug' | 'feature' | 'improvement' | 'documentation';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue';
export type ResourceType = 'human' | 'equipment' | 'budget' | 'software';
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  key: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  phase: ProjectPhase;
  category?: string;
  startDate: Date;
  endDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  budgetUSD?: number;
  spentUSD: number;
  remainingUSD: number;
  companyId?: string;
  dealId?: string;
  workspaceId?: string;
  projectManagerId?: string;
  teamIds: string[];
  memberIds: string[];
  progress: number;
  healthScore: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  completedMilestones: number;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  tenantId: string;
  projectId: string;
  title: string;
  description?: string;
  taskNumber: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  parentTaskId?: string;
  subtaskIds: string[];
  assigneeId?: string;
  reporterId: string;
  teamId?: string;
  estimatedHours?: number;
  actualHours: number;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  dependsOn: string[];
  blockedBy?: string[];
  progress: number;
  milestoneId?: string;
  sprintId?: string;
  tags: string[];
  attachments: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deliverable {
  id: string;
  milestoneId: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  fileUrls: string[];
  approvalRequired: boolean;
  approvedAt?: Date;
  approvedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: Date;
  completedAt?: Date;
  status: MilestoneStatus;
  progress: number;
  deliverables: Deliverable[];
  taskIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Sprint {
  id: string;
  tenantId: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  totalTasks: number;
  completedTasks: number;
  totalPoints: number;
  completedPoints: number;
  taskIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  type: ResourceType;
  description?: string;
  totalCapacity: number;
  allocatedCapacity: number;
  availableCapacity: number;
  hourlyRateUSD?: number;
  userId?: string;
  projectId?: string;
  isAvailable: boolean;
  unavailableFrom?: Date;
  unavailableTo?: Date;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  tenantId: string;
  userId: string;
  taskId?: string;
  projectId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  durationHours: number;
  description: string;
  billable: boolean;
  status: TimeEntryStatus;
  approvedAt?: Date;
  approvedBy?: string;
  hourlyRateUSD?: number;
  totalCostUSD?: number;
  createdAt: Date;
  updatedAt: Date;
}