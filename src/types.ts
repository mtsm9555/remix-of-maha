export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 1 | 2 | 3;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  url?: string | null;
  command_example?: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  task_id?: string | null;
  tool_id?: string | null;
  status: "success" | "error" | "running";
  message?: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
