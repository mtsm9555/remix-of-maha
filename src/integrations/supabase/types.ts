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
      agent_capability_embeddings: {
        Row: {
          agent_type: string
          capability_embedding: string
          cost_per_task_usd: number
          department: string
          supported_tools: string[]
          updated_at: string
        }
        Insert: {
          agent_type: string
          capability_embedding: string
          cost_per_task_usd?: number
          department: string
          supported_tools?: string[]
          updated_at?: string
        }
        Update: {
          agent_type?: string
          capability_embedding?: string
          cost_per_task_usd?: number
          department?: string
          supported_tools?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      agent_capability_maps: {
        Row: {
          agent_id: string
          agent_type: string
          capability_embedding: string | null
          department: string
          expertise: Json
          input_modalities: string[]
          last_updated: string
          output_modalities: string[]
          primary_model: Json
          tools: Json
          version: string
        }
        Insert: {
          agent_id: string
          agent_type: string
          capability_embedding?: string | null
          department: string
          expertise?: Json
          input_modalities?: string[]
          last_updated?: string
          output_modalities?: string[]
          primary_model?: Json
          tools?: Json
          version?: string
        }
        Update: {
          agent_id?: string
          agent_type?: string
          capability_embedding?: string | null
          department?: string
          expertise?: Json
          input_modalities?: string[]
          last_updated?: string
          output_modalities?: string[]
          primary_model?: Json
          tools?: Json
          version?: string
        }
        Relationships: []
      }
      agent_execution_logs: {
        Row: {
          created_at: string
          execution_latency_ms: number | null
          id: string
          instance_id: string
          routing_latency_ms: number | null
          success: boolean | null
          task_id: string
        }
        Insert: {
          created_at?: string
          execution_latency_ms?: number | null
          id?: string
          instance_id: string
          routing_latency_ms?: number | null
          success?: boolean | null
          task_id: string
        }
        Update: {
          created_at?: string
          execution_latency_ms?: number | null
          id?: string
          instance_id?: string
          routing_latency_ms?: number | null
          success?: boolean | null
          task_id?: string
        }
        Relationships: []
      }
      agent_instance_wallets: {
        Row: {
          agent_type: string
          current_balance_usd: number
          department: string
          initial_allocation_usd: number
          instance_id: string
          last_topup_at: string | null
          throttle_state: string
          total_spent_usd: number
          updated_at: string
        }
        Insert: {
          agent_type: string
          current_balance_usd?: number
          department: string
          initial_allocation_usd?: number
          instance_id: string
          last_topup_at?: string | null
          throttle_state?: string
          total_spent_usd?: number
          updated_at?: string
        }
        Update: {
          agent_type?: string
          current_balance_usd?: number
          department?: string
          initial_allocation_usd?: number
          instance_id?: string
          last_topup_at?: string | null
          throttle_state?: string
          total_spent_usd?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_instances_registry: {
        Row: {
          agent_id: string
          consecutive_errors: number
          created_at: string
          current_task_id: string | null
          department: string
          instance_id: string
          state: string
          tasks_completed: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          consecutive_errors?: number
          created_at?: string
          current_task_id?: string | null
          department: string
          instance_id: string
          state: string
          tasks_completed?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          consecutive_errors?: number
          created_at?: string
          current_task_id?: string | null
          department?: string
          instance_id?: string
          state?: string
          tasks_completed?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_lifecycle_logs: {
        Row: {
          from_state: string
          id: string
          instance_id: string
          reason: string | null
          timestamp: string
          to_state: string
        }
        Insert: {
          from_state: string
          id?: string
          instance_id: string
          reason?: string | null
          timestamp?: string
          to_state: string
        }
        Update: {
          from_state?: string
          id?: string
          instance_id?: string
          reason?: string | null
          timestamp?: string
          to_state?: string
        }
        Relationships: []
      }
      agent_message_logs: {
        Row: {
          collaboration_id: string | null
          created_at: string
          id: string
          intent: string
          payload: Json
          receiver_dept: string | null
          receiver_id: string | null
          sender_dept: string | null
          sender_id: string
        }
        Insert: {
          collaboration_id?: string | null
          created_at?: string
          id: string
          intent: string
          payload?: Json
          receiver_dept?: string | null
          receiver_id?: string | null
          sender_dept?: string | null
          sender_id: string
        }
        Update: {
          collaboration_id?: string | null
          created_at?: string
          id?: string
          intent?: string
          payload?: Json
          receiver_dept?: string | null
          receiver_id?: string | null
          sender_dept?: string | null
          sender_id?: string
        }
        Relationships: []
      }
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
      agent_performance_metrics: {
        Row: {
          agent_id: string
          average_qa_score: number
          human_override_rate: number
          success_rate: number
          total_tasks: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          average_qa_score?: number
          human_override_rate?: number
          success_rate?: number
          total_tasks?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          average_qa_score?: number
          human_override_rate?: number
          success_rate?: number
          total_tasks?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_prompt_versions: {
        Row: {
          agent_id: string
          created_at: string
          few_shot_examples: string[]
          id: string
          performance_metrics: Json
          replaced_at: string | null
          status: string
          system_prompt: string
          version_number: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          few_shot_examples?: string[]
          id?: string
          performance_metrics?: Json
          replaced_at?: string | null
          status: string
          system_prompt: string
          version_number: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          few_shot_examples?: string[]
          id?: string
          performance_metrics?: Json
          replaced_at?: string | null
          status?: string
          system_prompt?: string
          version_number?: number
        }
        Relationships: []
      }
      agent_registry_persistent: {
        Row: {
          agent_type: string
          capabilities: Json
          current_load: number
          department: string
          execution_endpoint: string
          instance_id: string
          last_heartbeat: string
          max_concurrent_tasks: number
          network_host: string
          network_port: number
          network_protocol: string
          registered_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_type: string
          capabilities?: Json
          current_load?: number
          department: string
          execution_endpoint?: string
          instance_id: string
          last_heartbeat?: string
          max_concurrent_tasks?: number
          network_host: string
          network_port: number
          network_protocol?: string
          registered_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          agent_type?: string
          capabilities?: Json
          current_load?: number
          department?: string
          execution_endpoint?: string
          instance_id?: string
          last_heartbeat?: string
          max_concurrent_tasks?: number
          network_host?: string
          network_port?: number
          network_protocol?: string
          registered_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_reputation_metrics: {
        Row: {
          agent_id: string
          average_qa_score: number
          budget_adherence: number
          human_override_rate: number
          self_correction_rate: number
          sla_compliance: number
          success_rate: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          average_qa_score?: number
          budget_adherence?: number
          human_override_rate?: number
          self_correction_rate?: number
          sla_compliance?: number
          success_rate?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          average_qa_score?: number
          budget_adherence?: number
          human_override_rate?: number
          self_correction_rate?: number
          sla_compliance?: number
          success_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      agent_reputation_scores: {
        Row: {
          agent_id: string
          composite_score: number
          department: string
          total_tasks_evaluated: number
          trend: string
          trust_level: string
          updated_at: string
        }
        Insert: {
          agent_id: string
          composite_score?: number
          department: string
          total_tasks_evaluated?: number
          trend?: string
          trust_level: string
          updated_at?: string
        }
        Update: {
          agent_id?: string
          composite_score?: number
          department?: string
          total_tasks_evaluated?: number
          trend?: string
          trust_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      blackboard_artifacts: {
        Row: {
          collaboration_id: string
          content: Json
          id: string
          locked_by: string | null
          owner_agent_id: string
          updated_at: string
          version: number
        }
        Insert: {
          collaboration_id: string
          content?: Json
          id: string
          locked_by?: string | null
          owner_agent_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          collaboration_id?: string
          content?: Json
          id?: string
          locked_by?: string | null
          owner_agent_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "blackboard_artifacts_collaboration_id_fkey"
            columns: ["collaboration_id"]
            isOneToOne: false
            referencedRelation: "collaboration_blackboards"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_topup_requests: {
        Row: {
          id: string
          instance_id: string
          processed_at: string | null
          reason: string
          requested_amount_usd: number
          requested_at: string
          status: string
        }
        Insert: {
          id: string
          instance_id: string
          processed_at?: string | null
          reason: string
          requested_amount_usd: number
          requested_at?: string
          status?: string
        }
        Update: {
          id?: string
          instance_id?: string
          processed_at?: string | null
          reason?: string
          requested_amount_usd?: number
          requested_at?: string
          status?: string
        }
        Relationships: []
      }
      budget_transactions: {
        Row: {
          agent_id: string
          amount: number
          cost_usd: number
          created_at: string
          department: string
          id: string
          metadata: Json
          resource_type: string
        }
        Insert: {
          agent_id: string
          amount: number
          cost_usd: number
          created_at?: string
          department: string
          id: string
          metadata?: Json
          resource_type: string
        }
        Update: {
          agent_id?: string
          amount?: number
          cost_usd?: number
          created_at?: string
          department?: string
          id?: string
          metadata?: Json
          resource_type?: string
        }
        Relationships: []
      }
      collaboration_blackboards: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      collaboration_sessions: {
        Row: {
          blackboard_id: string
          completed_at: string | null
          created_at: string
          id: string
          initiator_id: string
          objective: string
          participants: string[]
          status: string
        }
        Insert: {
          blackboard_id: string
          completed_at?: string | null
          created_at?: string
          id: string
          initiator_id: string
          objective: string
          participants?: string[]
          status: string
        }
        Update: {
          blackboard_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          initiator_id?: string
          objective?: string
          participants?: string[]
          status?: string
        }
        Relationships: []
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
      daily_budget_usage: {
        Row: {
          agent_id: string
          department: string
          id: string
          llm_cost_usd: number | null
          llm_tokens: number | null
          tool_cost_usd: number | null
          tool_executions: number | null
          total_cost_usd: number | null
          usage_date: string
        }
        Insert: {
          agent_id: string
          department: string
          id?: string
          llm_cost_usd?: number | null
          llm_tokens?: number | null
          tool_cost_usd?: number | null
          tool_executions?: number | null
          total_cost_usd?: number | null
          usage_date?: string
        }
        Update: {
          agent_id?: string
          department?: string
          id?: string
          llm_cost_usd?: number | null
          llm_tokens?: number | null
          tool_cost_usd?: number | null
          tool_executions?: number | null
          total_cost_usd?: number | null
          usage_date?: string
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
      enterprise_policies: {
        Row: {
          action: string
          conditions: Json
          created_at: string
          department: string | null
          description: string
          id: string
          is_active: boolean
          logic: string
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          action: string
          conditions?: Json
          created_at?: string
          department?: string | null
          description: string
          id?: string
          is_active?: boolean
          logic: string
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          action?: string
          conditions?: Json
          created_at?: string
          department?: string | null
          description?: string
          id?: string
          is_active?: boolean
          logic?: string
          name?: string
          priority?: number
          updated_at?: string
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
          department: string | null
          id: string
          properties: Json
          relation: string
          source_id: string
          source_name: string | null
          target_id: string
          target_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          id?: string
          properties?: Json
          relation: string
          source_id: string
          source_name?: string | null
          target_id: string
          target_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          id?: string
          properties?: Json
          relation?: string
          source_id?: string
          source_name?: string | null
          target_id?: string
          target_name?: string | null
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
      graph_expansion_logs: {
        Row: {
          completed_at: string
          department: string
          duplicates_merged: number
          id: string
          new_relationships: number
        }
        Insert: {
          completed_at?: string
          department: string
          duplicates_merged?: number
          id?: string
          new_relationships?: number
        }
        Update: {
          completed_at?: string
          department?: string
          duplicates_merged?: number
          id?: string
          new_relationships?: number
        }
        Relationships: []
      }
      graph_nodes: {
        Row: {
          created_at: string
          department: string | null
          embedding: string | null
          id: string
          label: string
          name: string
          properties: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          embedding?: string | null
          id?: string
          label?: string
          name: string
          properties?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
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
      learning_cycles: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          previous_version_id: string | null
          proposed_version_id: string | null
          reasoning: string | null
          status: string
          trigger: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          previous_version_id?: string | null
          proposed_version_id?: string | null
          reasoning?: string | null
          status: string
          trigger: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          previous_version_id?: string | null
          proposed_version_id?: string | null
          reasoning?: string | null
          status?: string
          trigger?: string
        }
        Relationships: []
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
      micro_transaction_ledger: {
        Row: {
          agent_type: string
          amount_usd: number
          balance_after: number
          department: string
          id: string
          instance_id: string
          reference_id: string
          resource_type: string
          timestamp: string
        }
        Insert: {
          agent_type: string
          amount_usd: number
          balance_after: number
          department: string
          id: string
          instance_id: string
          reference_id: string
          resource_type: string
          timestamp?: string
        }
        Update: {
          agent_type?: string
          amount_usd?: number
          balance_after?: number
          department?: string
          id?: string
          instance_id?: string
          reference_id?: string
          resource_type?: string
          timestamp?: string
        }
        Relationships: []
      }
      raw_memories: {
        Row: {
          content: string
          created_at: string
          department: string
          id: string
          is_consolidated: boolean
          source: string
        }
        Insert: {
          content: string
          created_at?: string
          department: string
          id?: string
          is_consolidated?: boolean
          source: string
        }
        Update: {
          content?: string
          created_at?: string
          department?: string
          id?: string
          is_consolidated?: boolean
          source?: string
        }
        Relationships: []
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
      reputation_events: {
        Row: {
          agent_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          score_impact: number
          severity: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          event_type: string
          id: string
          metadata?: Json
          score_impact: number
          severity: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          score_impact?: number
          severity?: string
        }
        Relationships: []
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
      transfer_edges: {
        Args: {
          is_reverse?: boolean
          source_dup: string
          target_primary: string
        }
        Returns: undefined
      }
      upsert_daily_usage: {
        Args: {
          p_agent_id: string
          p_department: string
          p_llm_cost_usd: number
          p_llm_tokens: number
          p_tool_cost_usd: number
          p_tool_executions: number
          p_total_cost_usd: number
        }
        Returns: undefined
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
