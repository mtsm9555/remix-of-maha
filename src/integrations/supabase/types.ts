export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_consolidated: boolean
          metadata: Json
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_consolidated?: boolean
          metadata?: Json
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_consolidated?: boolean
          metadata?: Json
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidated_memories: {
        Row: {
          created_at: string
          embedding: string | null
          entities: string[]
          id: string
          importance_score: number
          last_accessed: string
          relationships: Json
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          entities?: string[]
          id?: string
          importance_score?: number
          last_accessed?: string
          relationships?: Json
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          entities?: string[]
          id?: string
          importance_score?: number
          last_accessed?: string
          relationships?: Json
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      department_memories: {
        Row: {
          access_count: number
          content: string
          created_at: string
          department_id: string
          embedding: string | null
          id: string
          importance_score: number
          last_accessed_at: string
          metadata: Json
          type: string
        }
        Insert: {
          access_count?: number
          content: string
          created_at?: string
          department_id: string
          embedding?: string | null
          id?: string
          importance_score?: number
          last_accessed_at?: string
          metadata?: Json
          type: string
        }
        Update: {
          access_count?: number
          content?: string
          created_at?: string
          department_id?: string
          embedding?: string | null
          id?: string
          importance_score?: number
          last_accessed_at?: string
          metadata?: Json
          type?: string
        }
        Relationships: []
      }
      entities: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          created_at: string
          id: string
          properties: Json
          relation: string
          source_id: string
          target_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          properties?: Json
          relation: string
          source_id: string
          target_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          properties?: Json
          relation?: string
          source_id?: string
          target_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_nodes: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          label: string
          name: string
          properties: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          label?: string
          name: string
          properties?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          label?: string
          name?: string
          properties?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_nodes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          status: string | null
          task_id: string | null
          tool_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          task_id?: string | null
          tool_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          status?: string | null
          task_id?: string | null
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          id: string
          relation: string | null
          source_id: string | null
          target_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          relation?: string | null
          source_id?: string | null
          target_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          relation?: string | null
          source_id?: string | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationships_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tool_access_logs: {
        Row: {
          agent_id: string
          arguments: Json
          created_at: string
          decision: string
          department: string
          id: string
          reason: string | null
          tool_name: string
        }
        Insert: {
          agent_id: string
          arguments?: Json
          created_at?: string
          decision: string
          department: string
          id?: string
          reason?: string | null
          tool_name: string
        }
        Update: {
          agent_id?: string
          arguments?: Json
          created_at?: string
          decision?: string
          department?: string
          id?: string
          reason?: string | null
          tool_name?: string
        }
        Relationships: []
      }
      tool_executions: {
        Row: {
          agent_name: string | null
          args: Json | null
          created_at: string
          execution_time_ms: number | null
          id: string
          result: Json | null
          session_id: string | null
          tool_name: string
          user_id: string | null
        }
        Insert: {
          agent_name?: string | null
          args?: Json | null
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          result?: Json | null
          session_id?: string | null
          tool_name: string
          user_id?: string | null
        }
        Update: {
          agent_name?: string | null
          args?: Json | null
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          result?: Json | null
          session_id?: string | null
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tool_permissions: {
        Row: {
          allowed_departments: string[]
          created_at: string
          description: string | null
          id: string
          level: string
          max_executions_per_hour: number | null
          parameter_constraints: Json
          tool_name: string
          updated_at: string
        }
        Insert: {
          allowed_departments?: string[]
          created_at?: string
          description?: string | null
          id: string
          level: string
          max_executions_per_hour?: number | null
          parameter_constraints?: Json
          tool_name: string
          updated_at?: string
        }
        Update: {
          allowed_departments?: string[]
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          max_executions_per_hour?: number | null
          parameter_constraints?: Json
          tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools: {
        Row: {
          category: string | null
          command_example: string | null
          created_at: string | null
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          category?: string | null
          command_example?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          category?: string | null
          command_example?: string | null
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          permissions: string[]
          preferences: Json
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          permissions?: string[]
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          permissions?: string[]
          preferences?: Json
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflow_definitions: {
        Row: {
          created_at: string
          description: string | null
          edges_json: Json
          id: string
          name: string
          nodes_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          edges_json?: Json
          id?: string
          name: string
          nodes_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          edges_json?: Json
          id?: string
          name?: string
          nodes_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          input: Json | null
          node_outputs: Json
          started_at: string
          status: string
          updated_at: string
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          node_outputs?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          node_outputs?: Json
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflow_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      boost_memory_importance: {
        Args: { memory_ids: string[] }
        Returns: undefined
      }
      decay_stale_memories: {
        Args: { days_threshold: number; decay_factor: number }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      match_department_memories: {
        Args: {
          filter_types: string[]
          match_count: number
          match_threshold: number
          query_department: string
          query_embedding: string
        }
        Returns: {
          content: string
          department_id: string
          id: string
          importance_score: number
          metadata: Json
          similarity: number
          type: string
        }[]
      }
      match_memories: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
          target_user_id: string
        }
        Returns: {
          id: string
          similarity: number
          summary: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
