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
      advanced_jit_role_elevations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          expires_at: string
          id: string
          reason: string
          requested_at: string
          status: string
          target_role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          expires_at: string
          id?: string
          reason: string
          requested_at?: string
          status: string
          target_role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          expires_at?: string
          id?: string
          reason?: string
          requested_at?: string
          status?: string
          target_role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_jit_role_elevations_target_role_id_fkey"
            columns: ["target_role_id"]
            isOneToOne: false
            referencedRelation: "advanced_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_jit_role_elevations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          is_temporary: boolean
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_temporary?: boolean
          role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_temporary?: boolean
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "advanced_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_role_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_role_change_logs: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          details: Json
          id: string
          role_id: string
          tenant_id: string
        }
        Insert: {
          change_type: string
          changed_at?: string
          changed_by?: string | null
          details?: Json
          id?: string
          role_id: string
          tenant_id: string
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          details?: Json
          id?: string
          role_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_role_change_logs_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "advanced_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_role_change_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_role_templates: {
        Row: {
          category: string
          conditional_permissions: Json
          created_at: string
          description: string
          id: string
          is_system_template: boolean
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          category: string
          conditional_permissions?: Json
          created_at?: string
          description?: string
          id?: string
          is_system_template?: boolean
          name: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          conditional_permissions?: Json
          created_at?: string
          description?: string
          id?: string
          is_system_template?: boolean
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      advanced_roles: {
        Row: {
          conditional_permissions: Json
          created_at: string
          created_by: string | null
          current_member_count: number
          description: string
          direct_permissions: string[]
          effective_permissions: string[]
          id: string
          inheritance_depth: number
          inherited_permissions: string[]
          is_system_role: boolean
          is_template: boolean
          max_members: number
          name: string
          parent_role_id: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          conditional_permissions?: Json
          created_at?: string
          created_by?: string | null
          current_member_count?: number
          description?: string
          direct_permissions?: string[]
          effective_permissions?: string[]
          id?: string
          inheritance_depth?: number
          inherited_permissions?: string[]
          is_system_role?: boolean
          is_template?: boolean
          max_members?: number
          name: string
          parent_role_id?: string | null
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          conditional_permissions?: Json
          created_at?: string
          created_by?: string | null
          current_member_count?: number
          description?: string
          direct_permissions?: string[]
          effective_permissions?: string[]
          id?: string
          inheritance_depth?: number
          inherited_permissions?: string[]
          is_system_role?: boolean
          is_template?: boolean
          max_members?: number
          name?: string
          parent_role_id?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "advanced_roles_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "advanced_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      agent_health_metrics: {
        Row: {
          cpu_usage: number
          id: string
          instance_id: string
          llm_error_rate: number
          llm_latency_ms: number
          memory_usage_mb: number
          recorded_at: string
          success_rate: number
        }
        Insert: {
          cpu_usage?: number
          id?: string
          instance_id: string
          llm_error_rate?: number
          llm_latency_ms?: number
          memory_usage_mb?: number
          recorded_at?: string
          success_rate?: number
        }
        Update: {
          cpu_usage?: number
          id?: string
          instance_id?: string
          llm_error_rate?: number
          llm_latency_ms?: number
          memory_usage_mb?: number
          recorded_at?: string
          success_rate?: number
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
      agent_tool_pins: {
        Row: {
          agent_id: string
          id: string
          pinned_at: string
          pinned_version: string
          reason: string | null
          tool_name: string
        }
        Insert: {
          agent_id: string
          id?: string
          pinned_at?: string
          pinned_version: string
          reason?: string | null
          tool_name: string
        }
        Update: {
          agent_id?: string
          id?: string
          pinned_at?: string
          pinned_version?: string
          reason?: string | null
          tool_name?: string
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          average_latency_ms: number
          capabilities: string[]
          cost_per_input_token_usd: number
          cost_per_output_token_usd: number
          cost_per_request_usd: number | null
          created_at: string | null
          current_load: number
          deprecated_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          max_context_tokens: number
          max_output_tokens: number
          metadata: Json | null
          model_name: string
          p95_latency_ms: number
          provider: string
          rate_limit_per_minute: number
          released_at: string
          supports_function_calling: boolean | null
          supports_streaming: boolean | null
          supports_vision: boolean | null
          throughput_tokens_per_second: number
          updated_at: string | null
          version: string
        }
        Insert: {
          average_latency_ms?: number
          capabilities?: string[]
          cost_per_input_token_usd?: number
          cost_per_output_token_usd?: number
          cost_per_request_usd?: number | null
          created_at?: string | null
          current_load?: number
          deprecated_at?: string | null
          display_name: string
          id: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_context_tokens: number
          max_output_tokens: number
          metadata?: Json | null
          model_name: string
          p95_latency_ms?: number
          provider: string
          rate_limit_per_minute?: number
          released_at?: string
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          throughput_tokens_per_second?: number
          updated_at?: string | null
          version: string
        }
        Update: {
          average_latency_ms?: number
          capabilities?: string[]
          cost_per_input_token_usd?: number
          cost_per_output_token_usd?: number
          cost_per_request_usd?: number | null
          created_at?: string | null
          current_load?: number
          deprecated_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_context_tokens?: number
          max_output_tokens?: number
          metadata?: Json | null
          model_name?: string
          p95_latency_ms?: number
          provider?: string
          rate_limit_per_minute?: number
          released_at?: string
          supports_function_calling?: boolean | null
          supports_streaming?: boolean | null
          supports_vision?: boolean | null
          throughput_tokens_per_second?: number
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      api_key_audit_logs: {
        Row: {
          action: string
          api_key_id: string
          details: Json
          id: string
          ip_address: string | null
          performed_at: string
          performed_by: string
          tenant_id: string
        }
        Insert: {
          action: string
          api_key_id: string
          details?: Json
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by: string
          tenant_id: string
        }
        Update: {
          action?: string
          api_key_id?: string
          details?: Json
          id?: string
          ip_address?: string | null
          performed_at?: string
          performed_by?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_audit_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_usage_records: {
        Row: {
          api_key_id: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: string
          method: string
          response_status: number
          response_time_ms: number
          success: boolean
          tenant_id: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address: string
          method: string
          response_status: number
          response_time_ms: number
          success: boolean
          tenant_id: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: string
          method?: string
          response_status?: number
          response_time_ms?: number
          success?: boolean
          tenant_id?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_records_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_usage_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          allowed_departments: string[]
          allowed_endpoints: string[]
          created_at: string
          created_by: string
          description: string | null
          expires_at: string | null
          id: string
          ip_allowlist: string[]
          ip_blocklist: string[]
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          last_used_ip: string | null
          name: string
          permissions: string[]
          rate_limit_per_day: number
          rate_limit_per_minute: number
          requests_this_month: number
          requests_today: number
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          rotation_policy: Json | null
          scopes: string[]
          status: string
          tenant_id: string
          total_requests: number
          updated_at: string
        }
        Insert: {
          allowed_departments?: string[]
          allowed_endpoints?: string[]
          created_at?: string
          created_by: string
          description?: string | null
          expires_at?: string | null
          id: string
          ip_allowlist?: string[]
          ip_blocklist?: string[]
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          last_used_ip?: string | null
          name: string
          permissions?: string[]
          rate_limit_per_day?: number
          rate_limit_per_minute?: number
          requests_this_month?: number
          requests_today?: number
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_policy?: Json | null
          scopes?: string[]
          status?: string
          tenant_id: string
          total_requests?: number
          updated_at?: string
        }
        Update: {
          allowed_departments?: string[]
          allowed_endpoints?: string[]
          created_at?: string
          created_by?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          ip_allowlist?: string[]
          ip_blocklist?: string[]
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          last_used_ip?: string | null
          name?: string
          permissions?: string[]
          rate_limit_per_day?: number
          rate_limit_per_minute?: number
          requests_this_month?: number
          requests_today?: number
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_policy?: Json | null
          scopes?: string[]
          status?: string
          tenant_id?: string
          total_requests?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_assignments: {
        Row: {
          approver_id: string
          approver_role: string | null
          assigned_at: string
          created_at: string | null
          decision: Json | null
          id: string
          request_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          approver_id: string
          approver_role?: string | null
          assigned_at: string
          created_at?: string | null
          decision?: Json | null
          id: string
          request_id: string
          responded_at?: string | null
          status: string
        }
        Update: {
          approver_id?: string
          approver_role?: string | null
          assigned_at?: string
          created_at?: string | null
          decision?: Json | null
          id?: string
          request_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_decisions: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string | null
          decided_at: string
          decision: string
          id: string
          metadata: Json | null
          request_id: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string | null
          decided_at: string
          decision: string
          id: string
          metadata?: Json | null
          request_id: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          decided_at?: string
          decision?: string
          id?: string
          metadata?: Json | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_decisions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_executions: {
        Row: {
          action: string
          created_at: string | null
          error: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          payload: Json
          request_id: string
          result: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string | null
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id: string
          payload?: Json
          request_id: string
          result?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string | null
          error?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          payload?: Json
          request_id?: string
          result?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_executions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_notifications: {
        Row: {
          channel: string
          content: Json
          created_at: string | null
          id: string
          read_at: string | null
          recipient_id: string
          request_id: string
          sent_at: string
          type: string
        }
        Insert: {
          channel: string
          content: Json
          created_at?: string | null
          id: string
          read_at?: string | null
          recipient_id: string
          request_id: string
          sent_at: string
          type: string
        }
        Update: {
          channel?: string
          content?: Json
          created_at?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          request_id?: string
          sent_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_policies: {
        Row: {
          action: string
          approval_type: string
          approver_hierarchy: string[] | null
          approver_roles: string[] | null
          approver_users: string[] | null
          auto_reject_on_timeout: boolean | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_channels: string[] | null
          notify_approvers: boolean | null
          notify_requester: boolean | null
          priority: string
          required_approvers: number
          tenant_id: string
          timeout_minutes: number
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          approval_type: string
          approver_hierarchy?: string[] | null
          approver_roles?: string[] | null
          approver_users?: string[] | null
          auto_reject_on_timeout?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          notification_channels?: string[] | null
          notify_approvers?: boolean | null
          notify_requester?: boolean | null
          priority?: string
          required_approvers?: number
          tenant_id: string
          timeout_minutes?: number
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          approval_type?: string
          approver_hierarchy?: string[] | null
          approver_roles?: string[] | null
          approver_users?: string[] | null
          auto_reject_on_timeout?: boolean | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_channels?: string[] | null
          notify_approvers?: boolean | null
          notify_requester?: boolean | null
          priority?: string
          required_approvers?: number
          tenant_id?: string
          timeout_minutes?: number
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action: string
          approved_at: string | null
          assigned_approvers: Json | null
          created_at: string | null
          current_approver_index: number | null
          decisions: Json | null
          executed_at: string | null
          executed_by: string | null
          execution_result: Json | null
          expires_at: string
          id: string
          justification: string
          metadata: Json | null
          policy_id: string
          priority: string
          rejected_at: string | null
          request_data: Json
          requested_at: string
          requested_by: string
          status: string
          target_resource_id: string | null
          target_resource_name: string | null
          target_resource_type: string | null
          tenant_id: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          approved_at?: string | null
          assigned_approvers?: Json | null
          created_at?: string | null
          current_approver_index?: number | null
          decisions?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at: string
          id: string
          justification: string
          metadata?: Json | null
          policy_id: string
          priority: string
          rejected_at?: string | null
          request_data?: Json
          requested_at: string
          requested_by: string
          status: string
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          tenant_id: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          approved_at?: string | null
          assigned_approvers?: Json | null
          created_at?: string | null
          current_approver_index?: number | null
          decisions?: Json | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at?: string
          id?: string
          justification?: string
          metadata?: Json | null
          policy_id?: string
          priority?: string
          rejected_at?: string | null
          request_data?: Json
          requested_at?: string
          requested_by?: string
          status?: string
          target_resource_id?: string | null
          target_resource_name?: string | null
          target_resource_type?: string | null
          tenant_id?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "approval_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string
          event_count: number
          id: string
          metadata: Json | null
          related_event_ids: string[]
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          description: string
          event_count?: number
          id: string
          metadata?: Json | null
          related_event_ids?: string[]
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string
          event_count?: number
          id?: string
          metadata?: Json | null
          related_event_ids?: string[]
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_exports: {
        Row: {
          completed_at: string | null
          created_at: string
          downloaded_at: string | null
          downloaded_by: string | null
          error_message: string | null
          event_count: number | null
          expires_at: string
          file_content: string | null
          file_size_bytes: number | null
          file_url: string | null
          format: string
          id: string
          progress: number
          query: Json
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          downloaded_at?: string | null
          downloaded_by?: string | null
          error_message?: string | null
          event_count?: number | null
          expires_at: string
          file_content?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format: string
          id: string
          progress?: number
          query: Json
          status: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          downloaded_at?: string | null
          downloaded_by?: string | null
          error_message?: string | null
          event_count?: number | null
          expires_at?: string
          file_content?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          progress?: number
          query?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_email: string | null
          actor_id: string
          actor_name: string | null
          actor_type: string
          correlation_id: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_type: string
          id: string
          ip_address: string
          metadata: Json | null
          session_id: string | null
          severity: string
          success: boolean
          target_id: string | null
          target_name: string | null
          target_type: string | null
          tenant_id: string
          timestamp: string
          user_agent: string
          workspace_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_id: string
          actor_name?: string | null
          actor_type: string
          correlation_id?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_type: string
          id: string
          ip_address: string
          metadata?: Json | null
          session_id?: string | null
          severity: string
          success: boolean
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          tenant_id: string
          timestamp: string
          user_agent: string
          workspace_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_id?: string
          actor_name?: string | null
          actor_type?: string
          correlation_id?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string
          metadata?: Json | null
          session_id?: string | null
          severity?: string
          success?: boolean
          target_id?: string | null
          target_name?: string | null
          target_type?: string | null
          tenant_id?: string
          timestamp?: string
          user_agent?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_retention: {
        Row: {
          archive_after_days: number
          archived_storage_bytes: number
          created_at: string
          last_cleanup_at: string | null
          newest_event_date: string | null
          next_cleanup_at: string | null
          oldest_event_date: string | null
          retention_days: number
          storage_used_bytes: number
          tenant_id: string
          total_events: number
          updated_at: string
        }
        Insert: {
          archive_after_days?: number
          archived_storage_bytes?: number
          created_at?: string
          last_cleanup_at?: string | null
          newest_event_date?: string | null
          next_cleanup_at?: string | null
          oldest_event_date?: string | null
          retention_days?: number
          storage_used_bytes?: number
          tenant_id: string
          total_events?: number
          updated_at?: string
        }
        Update: {
          archive_after_days?: number
          archived_storage_bytes?: number
          created_at?: string
          last_cleanup_at?: string | null
          newest_event_date?: string | null
          next_cleanup_at?: string | null
          oldest_event_date?: string | null
          retention_days?: number
          storage_used_bytes?: number
          tenant_id?: string
          total_events?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_retention_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_id: string
          checksum_sha256: string
          completed_at: string | null
          compressed_size_bytes: number
          compression_ratio: number
          created_at: string
          encrypted: boolean
          encryption_key_id: string | null
          error_message: string | null
          exclude_paths: string[] | null
          exclude_tables: string[] | null
          expires_at: string | null
          file_count: number
          id: string
          include_paths: string[] | null
          include_tables: string[] | null
          metadata: Json
          progress: number
          retention_days: number
          scheduled_at: string | null
          size_bytes: number
          started_at: string | null
          status: string
          storage: string
          storage_path: string
          storage_region: string
          target: string
          tenant_id: string
          type: string
          updated_at: string
          verification_details: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          backup_id: string
          checksum_sha256?: string
          completed_at?: string | null
          compressed_size_bytes?: number
          compression_ratio?: number
          created_at?: string
          encrypted?: boolean
          encryption_key_id?: string | null
          error_message?: string | null
          exclude_paths?: string[] | null
          exclude_tables?: string[] | null
          expires_at?: string | null
          file_count?: number
          id?: string
          include_paths?: string[] | null
          include_tables?: string[] | null
          metadata?: Json
          progress?: number
          retention_days?: number
          scheduled_at?: string | null
          size_bytes?: number
          started_at?: string | null
          status?: string
          storage: string
          storage_path?: string
          storage_region?: string
          target: string
          tenant_id: string
          type: string
          updated_at?: string
          verification_details?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          backup_id?: string
          checksum_sha256?: string
          completed_at?: string | null
          compressed_size_bytes?: number
          compression_ratio?: number
          created_at?: string
          encrypted?: boolean
          encryption_key_id?: string | null
          error_message?: string | null
          exclude_paths?: string[] | null
          exclude_tables?: string[] | null
          expires_at?: string | null
          file_count?: number
          id?: string
          include_paths?: string[] | null
          include_tables?: string[] | null
          metadata?: Json
          progress?: number
          retention_days?: number
          scheduled_at?: string | null
          size_bytes?: number
          started_at?: string | null
          status?: string
          storage?: string
          storage_path?: string
          storage_region?: string
          target?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          verification_details?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_policies: {
        Row: {
          auto_verify: boolean
          compression_enabled: boolean
          compression_level: number
          created_at: string
          cron_expression: string | null
          description: string | null
          enable_cross_region_replication: boolean
          encrypted: boolean
          encryption_key_id: string | null
          exclude_paths: string[] | null
          exclude_tables: string[] | null
          frequency: string
          id: string
          include_paths: string[] | null
          include_tables: string[] | null
          is_active: boolean
          last_run_at: string | null
          max_backups: number
          name: string
          next_run_at: string | null
          notify_on_failure: boolean
          notify_on_success: boolean
          replica_regions: string[] | null
          retention_days: number
          storage: string
          target: string
          tenant_id: string
          type: string
          updated_at: string
          verification_frequency: string
        }
        Insert: {
          auto_verify?: boolean
          compression_enabled?: boolean
          compression_level?: number
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          enable_cross_region_replication?: boolean
          encrypted?: boolean
          encryption_key_id?: string | null
          exclude_paths?: string[] | null
          exclude_tables?: string[] | null
          frequency: string
          id?: string
          include_paths?: string[] | null
          include_tables?: string[] | null
          is_active?: boolean
          last_run_at?: string | null
          max_backups?: number
          name: string
          next_run_at?: string | null
          notify_on_failure?: boolean
          notify_on_success?: boolean
          replica_regions?: string[] | null
          retention_days?: number
          storage: string
          target: string
          tenant_id: string
          type: string
          updated_at?: string
          verification_frequency?: string
        }
        Update: {
          auto_verify?: boolean
          compression_enabled?: boolean
          compression_level?: number
          created_at?: string
          cron_expression?: string | null
          description?: string | null
          enable_cross_region_replication?: boolean
          encrypted?: boolean
          encryption_key_id?: string | null
          exclude_paths?: string[] | null
          exclude_tables?: string[] | null
          frequency?: string
          id?: string
          include_paths?: string[] | null
          include_tables?: string[] | null
          is_active?: boolean
          last_run_at?: string | null
          max_backups?: number
          name?: string
          next_run_at?: string | null
          notify_on_failure?: boolean
          notify_on_success?: boolean
          replica_regions?: string[] | null
          retention_days?: number
          storage?: string
          target?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          verification_frequency?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_verification_logs: {
        Row: {
          backup_job_id: string
          checksum_actual: string | null
          checksum_expected: string | null
          created_at: string
          details: string | null
          duration_ms: number | null
          id: string
          status: string
          tenant_id: string
          verification_type: string
        }
        Insert: {
          backup_job_id: string
          checksum_actual?: string | null
          checksum_expected?: string | null
          created_at?: string
          details?: string | null
          duration_ms?: number | null
          id?: string
          status: string
          tenant_id: string
          verification_type: string
        }
        Update: {
          backup_job_id?: string
          checksum_actual?: string | null
          checksum_expected?: string | null
          created_at?: string
          details?: string | null
          duration_ms?: number | null
          id?: string
          status?: string
          tenant_id?: string
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_verification_logs_backup_job_id_fkey"
            columns: ["backup_job_id"]
            isOneToOne: false
            referencedRelation: "backup_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_credits: {
        Row: {
          amount_usd: number
          applied_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          issued_by: string
          reason: string
          remaining_usd: number
          status: string
          tenant_id: string
        }
        Insert: {
          amount_usd: number
          applied_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          issued_by: string
          reason: string
          remaining_usd: number
          status: string
          tenant_id: string
        }
        Update: {
          amount_usd?: number
          applied_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          issued_by?: string
          reason?: string
          remaining_usd?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_dunning_attempts: {
        Row: {
          attempt_number: number
          id: string
          invoice_id: string
          result: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          attempt_number: number
          id?: string
          invoice_id: string
          result?: string | null
          scheduled_at: string
          sent_at?: string | null
          status: string
          tenant_id: string
        }
        Update: {
          attempt_number?: number
          id?: string
          invoice_id?: string
          result?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_dunning_attempts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_dunning_attempts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_events: {
        Row: {
          amount_usd: number | null
          details: Json
          event_type: string
          id: string
          invoice_id: string | null
          payment_id: string | null
          tenant_id: string
          timestamp: string
        }
        Insert: {
          amount_usd?: number | null
          details?: Json
          event_type: string
          id?: string
          invoice_id?: string | null
          payment_id?: string | null
          tenant_id: string
          timestamp?: string
        }
        Update: {
          amount_usd?: number | null
          details?: Json
          event_type?: string
          id?: string
          invoice_id?: string | null
          payment_id?: string | null
          tenant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_paid_usd: number
          amount_remaining_usd: number
          amount_usd: number
          attempt_count: number
          created_at: string
          currency: string
          discount_usd: number
          due_date: string | null
          id: string
          invoice_date: string
          last_attempt_at: string | null
          line_items: Json
          metadata: Json
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          subtotal_usd: number
          tax_usd: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_paid_usd?: number
          amount_remaining_usd?: number
          amount_usd: number
          attempt_count?: number
          created_at?: string
          currency?: string
          discount_usd?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          last_attempt_at?: string | null
          line_items?: Json
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          subtotal_usd?: number
          tax_usd?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_paid_usd?: number
          amount_remaining_usd?: number
          amount_usd?: number
          attempt_count?: number
          created_at?: string
          currency?: string
          discount_usd?: number
          due_date?: string | null
          id?: string
          invoice_date?: string
          last_attempt_at?: string | null
          line_items?: Json
          metadata?: Json
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          subtotal_usd?: number
          tax_usd?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_payments: {
        Row: {
          amount_usd: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          payment_method: Json
          processed_at: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_method?: Json
          processed_at?: string | null
          status: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          payment_method?: Json
          processed_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "billing_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_refunds: {
        Row: {
          amount_usd: number
          created_at: string
          currency: string
          id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          requested_by: string
          status: string
          stripe_refund_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          currency?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          requested_by: string
          status: string
          stripe_refund_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          requested_by?: string
          status?: string
          stripe_refund_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "billing_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_refunds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      cache_configs: {
        Row: {
          created_at: string
          default_strategy: string
          description: string | null
          enable_tenant_isolation: boolean
          enabled_levels: string[]
          id: string
          is_active: boolean
          l1_default_ttl_seconds: number
          l1_invalidation_policy: string
          l1_max_size_mb: number
          l2_default_ttl_seconds: number
          l2_invalidation_policy: string
          l2_max_memory_mb: number
          l3_default_ttl_seconds: number
          l3_invalidation_policy: string
          min_cost_to_cache_usd: number
          name: string
          semantic_default_ttl_seconds: number
          semantic_enabled: boolean
          semantic_max_entries: number
          semantic_similarity_threshold: number
          track_cost_savings: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_strategy?: string
          description?: string | null
          enable_tenant_isolation?: boolean
          enabled_levels?: string[]
          id?: string
          is_active?: boolean
          l1_default_ttl_seconds?: number
          l1_invalidation_policy?: string
          l1_max_size_mb?: number
          l2_default_ttl_seconds?: number
          l2_invalidation_policy?: string
          l2_max_memory_mb?: number
          l3_default_ttl_seconds?: number
          l3_invalidation_policy?: string
          min_cost_to_cache_usd?: number
          name: string
          semantic_default_ttl_seconds?: number
          semantic_enabled?: boolean
          semantic_max_entries?: number
          semantic_similarity_threshold?: number
          track_cost_savings?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_strategy?: string
          description?: string | null
          enable_tenant_isolation?: boolean
          enabled_levels?: string[]
          id?: string
          is_active?: boolean
          l1_default_ttl_seconds?: number
          l1_invalidation_policy?: string
          l1_max_size_mb?: number
          l2_default_ttl_seconds?: number
          l2_invalidation_policy?: string
          l2_max_memory_mb?: number
          l3_default_ttl_seconds?: number
          l3_invalidation_policy?: string
          min_cost_to_cache_usd?: number
          name?: string
          semantic_default_ttl_seconds?: number
          semantic_enabled?: boolean
          semantic_max_entries?: number
          semantic_similarity_threshold?: number
          track_cost_savings?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cache_entries: {
        Row: {
          access_count: number
          correlation_id: string | null
          created_at: string
          embedding: Json | null
          expires_at: string
          hit_count: number
          id: string
          invalidation_tags: string[]
          key: string
          last_accessed_at: string
          level: string
          miss_count: number
          original_cost_usd: number | null
          saved_cost_usd: number | null
          serialized_value: string
          similarity_threshold: number | null
          size_bytes: number
          tenant_id: string | null
          type: string
          updated_at: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          access_count?: number
          correlation_id?: string | null
          created_at?: string
          embedding?: Json | null
          expires_at: string
          hit_count?: number
          id?: string
          invalidation_tags?: string[]
          key: string
          last_accessed_at?: string
          level: string
          miss_count?: number
          original_cost_usd?: number | null
          saved_cost_usd?: number | null
          serialized_value: string
          similarity_threshold?: number | null
          size_bytes?: number
          tenant_id?: string | null
          type: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          access_count?: number
          correlation_id?: string | null
          created_at?: string
          embedding?: Json | null
          expires_at?: string
          hit_count?: number
          id?: string
          invalidation_tags?: string[]
          key?: string
          last_accessed_at?: string
          level?: string
          miss_count?: number
          original_cost_usd?: number | null
          saved_cost_usd?: number | null
          serialized_value?: string
          similarity_threshold?: number | null
          size_bytes?: number
          tenant_id?: string | null
          type?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      cache_invalidation_events: {
        Row: {
          created_at: string
          entries_removed: number
          id: string
          reason: string | null
          scope: string
          target: string
          tenant_id: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          entries_removed?: number
          id?: string
          reason?: string | null
          scope: string
          target: string
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          entries_removed?: number
          id?: string
          reason?: string | null
          scope?: string
          target?: string
          tenant_id?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      cluster_tasks: {
        Row: {
          assigned_worker_id: string | null
          attempts: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          max_attempts: number
          metadata: Json | null
          payload: Json
          preferred_region: string | null
          preferred_worker_id: string | null
          priority: string
          queued_at: string
          required_capabilities: string[]
          result: Json | null
          started_at: string | null
          status: string
          tenant_id: string
          timeout_ms: number
          type: string
          workspace_id: string | null
        }
        Insert: {
          assigned_worker_id?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id: string
          max_attempts?: number
          metadata?: Json | null
          payload?: Json
          preferred_region?: string | null
          preferred_worker_id?: string | null
          priority: string
          queued_at?: string
          required_capabilities?: string[]
          result?: Json | null
          started_at?: string | null
          status: string
          tenant_id: string
          timeout_ms?: number
          type: string
          workspace_id?: string | null
        }
        Update: {
          assigned_worker_id?: string | null
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json | null
          payload?: Json
          preferred_region?: string | null
          preferred_worker_id?: string | null
          priority?: string
          queued_at?: string
          required_capabilities?: string[]
          result?: Json | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          timeout_ms?: number
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_tasks_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "worker_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cluster_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      compliance_audit_log: {
        Row: {
          details: Json
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          performed_by: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id: string
          performed_by: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          performed_by?: string
          timestamp?: string
          user_id?: string | null
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
      context_snapshots: {
        Row: {
          agent_id: string
          chunk_metadata: Json
          created_at: string
          department: string
          estimated_cost_usd: number
          full_prompt_text: string
          id: string
          llm_model_used: string
          llm_temperature: number
          prompt_hash: string
          task_id: string
          tenant_id: string | null
          total_tokens: number
        }
        Insert: {
          agent_id: string
          chunk_metadata?: Json
          created_at?: string
          department: string
          estimated_cost_usd: number
          full_prompt_text: string
          id: string
          llm_model_used: string
          llm_temperature: number
          prompt_hash: string
          task_id: string
          tenant_id?: string | null
          total_tokens: number
        }
        Update: {
          agent_id?: string
          chunk_metadata?: Json
          created_at?: string
          department?: string
          estimated_cost_usd?: number
          full_prompt_text?: string
          id?: string
          llm_model_used?: string
          llm_temperature?: number
          prompt_hash?: string
          task_id?: string
          tenant_id?: string | null
          total_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "context_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      cost_attribution_rollups: {
        Row: {
          department: string
          period_start: string
          tool_name: string
          total_cost_usd: number
          total_executions: number
        }
        Insert: {
          department: string
          period_start: string
          tool_name: string
          total_cost_usd: number
          total_executions: number
        }
        Update: {
          department?: string
          period_start?: string
          tool_name?: string
          total_cost_usd?: number
          total_executions?: number
        }
        Relationships: []
      }
      cross_workspace_access: {
        Row: {
          access_type: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          source_workspace_id: string
          target_workspace_id: string
        }
        Insert: {
          access_type: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id: string
          is_active?: boolean
          source_workspace_id: string
          target_workspace_id: string
        }
        Update: {
          access_type?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          source_workspace_id?: string
          target_workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_workspace_access_source_workspace_id_fkey"
            columns: ["source_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_workspace_access_target_workspace_id_fkey"
            columns: ["target_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      dead_letter_queue: {
        Row: {
          attempts: number
          can_retry: boolean
          created_at: string
          failed_at: string
          id: string
          last_error: string
          last_error_code: string
          max_manual_retries: number
          metadata: Json
          original_task_id: string
          payload: Json
          priority: number
          queue_id: string
          retry_count: number
          tenant_id: string
          type: string
        }
        Insert: {
          attempts: number
          can_retry?: boolean
          created_at?: string
          failed_at: string
          id: string
          last_error: string
          last_error_code: string
          max_manual_retries?: number
          metadata?: Json
          original_task_id: string
          payload?: Json
          priority: number
          queue_id: string
          retry_count?: number
          tenant_id: string
          type: string
        }
        Update: {
          attempts?: number
          can_retry?: boolean
          created_at?: string
          failed_at?: string
          id?: string
          last_error?: string
          last_error_code?: string
          max_manual_retries?: number
          metadata?: Json
          original_task_id?: string
          payload?: Json
          priority?: number
          queue_id?: string
          retry_count?: number
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dead_letter_queue_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dead_letter_queue_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          kpi_impact: Json | null
          last_accessed_at: string
          metadata: Json
          source_project_id: string | null
          synthesis_state: string
          tenant_id: string | null
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
          kpi_impact?: Json | null
          last_accessed_at?: string
          metadata?: Json
          source_project_id?: string | null
          synthesis_state?: string
          tenant_id?: string | null
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
          kpi_impact?: Json | null
          last_accessed_at?: string
          metadata?: Json
          source_project_id?: string | null
          synthesis_state?: string
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_memories_source_project_id_fkey"
            columns: ["source_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_memories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dr_regions: {
        Row: {
          api_endpoint: string
          cache_endpoint: string
          cpu_utilization: number
          created_at: string | null
          database_endpoint: string
          failover_priority: number
          health_score: number
          id: string
          is_healthy: boolean | null
          is_primary: boolean | null
          last_health_check_at: string
          last_replicated_at: string
          memory_utilization: number
          metadata: Json | null
          region_name: string
          replication_lag_seconds: number
          replication_status: string
          status: string
          storage_endpoint: string
          storage_utilization: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          cache_endpoint: string
          cpu_utilization?: number
          created_at?: string | null
          database_endpoint: string
          failover_priority?: number
          health_score?: number
          id: string
          is_healthy?: boolean | null
          is_primary?: boolean | null
          last_health_check_at?: string
          last_replicated_at?: string
          memory_utilization?: number
          metadata?: Json | null
          region_name: string
          replication_lag_seconds?: number
          replication_status?: string
          status: string
          storage_endpoint: string
          storage_utilization?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          cache_endpoint?: string
          cpu_utilization?: number
          created_at?: string | null
          database_endpoint?: string
          failover_priority?: number
          health_score?: number
          id?: string
          is_healthy?: boolean | null
          is_primary?: boolean | null
          last_health_check_at?: string
          last_replicated_at?: string
          memory_utilization?: number
          metadata?: Json | null
          region_name?: string
          replication_lag_seconds?: number
          replication_status?: string
          status?: string
          storage_endpoint?: string
          storage_utilization?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dr_regions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dr_tests: {
        Row: {
          actual_rpo_seconds: number | null
          actual_rto_seconds: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          failed_steps: number
          id: string
          metadata: Json | null
          passed_steps: number
          plan_id: string
          recommendations: string[] | null
          rpo_met: boolean | null
          rto_met: boolean | null
          scheduled_at: string
          started_at: string | null
          status: string
          target_rpo_seconds: number
          target_rto_seconds: number
          tenant_id: string
          test_name: string
          test_results: Json | null
          test_type: string
          total_steps: number
          updated_at: string | null
        }
        Insert: {
          actual_rpo_seconds?: number | null
          actual_rto_seconds?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_steps?: number
          id: string
          metadata?: Json | null
          passed_steps?: number
          plan_id: string
          recommendations?: string[] | null
          rpo_met?: boolean | null
          rto_met?: boolean | null
          scheduled_at: string
          started_at?: string | null
          status: string
          target_rpo_seconds: number
          target_rto_seconds: number
          tenant_id: string
          test_name: string
          test_results?: Json | null
          test_type: string
          total_steps?: number
          updated_at?: string | null
        }
        Update: {
          actual_rpo_seconds?: number | null
          actual_rto_seconds?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_steps?: number
          id?: string
          metadata?: Json | null
          passed_steps?: number
          plan_id?: string
          recommendations?: string[] | null
          rpo_met?: boolean | null
          rto_met?: boolean | null
          scheduled_at?: string
          started_at?: string | null
          status?: string
          target_rpo_seconds?: number
          target_rto_seconds?: number
          tenant_id?: string
          test_name?: string
          test_results?: Json | null
          test_type?: string
          total_steps?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dr_tests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "failover_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dr_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dsar_requests: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          processed_by: string
          request_type: string
          requested_at: string
          scope: Json
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id: string
          notes?: string | null
          processed_by: string
          request_type: string
          requested_at?: string
          scope: Json
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string
          request_type?: string
          requested_at?: string
          scope?: Json
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      encrypted_fields: {
        Row: {
          algorithm: string
          classification: string
          created_at: string
          description: string | null
          encryption_key_id: string
          field_name: string
          id: string
          is_active: boolean | null
          requires_audit: boolean | null
          table_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          algorithm: string
          classification: string
          created_at?: string
          description?: string | null
          encryption_key_id: string
          field_name: string
          id?: string
          is_active?: boolean | null
          requires_audit?: boolean | null
          table_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          algorithm?: string
          classification?: string
          created_at?: string
          description?: string | null
          encryption_key_id?: string
          field_name?: string
          id?: string
          is_active?: boolean | null
          requires_audit?: boolean | null
          table_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_fields_encryption_key_id_fkey"
            columns: ["encryption_key_id"]
            isOneToOne: false
            referencedRelation: "encryption_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encrypted_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_audit_logs: {
        Row: {
          action: string
          actor_id: string
          actor_type: string
          error_message: string | null
          field_name: string | null
          id: string
          ip_address: string | null
          key_id: string | null
          record_count: number | null
          success: boolean
          table_name: string | null
          tenant_id: string
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          actor_type: string
          error_message?: string | null
          field_name?: string | null
          id: string
          ip_address?: string | null
          key_id?: string | null
          record_count?: number | null
          success: boolean
          table_name?: string | null
          tenant_id: string
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          actor_type?: string
          error_message?: string | null
          field_name?: string | null
          id?: string
          ip_address?: string | null
          key_id?: string | null
          record_count?: number | null
          success?: boolean
          table_name?: string | null
          tenant_id?: string
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encryption_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          algorithm: string
          allowed_roles: string[] | null
          allowed_services: string[] | null
          created_at: string
          created_by: string
          description: string | null
          encrypted_key_material: string
          id: string
          is_active: boolean | null
          is_revoked: boolean | null
          key_version: number
          last_rotated_at: string | null
          name: string
          next_rotation_at: string | null
          revoked_at: string | null
          rotation_enabled: boolean | null
          rotation_interval_days: number | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          algorithm: string
          allowed_roles?: string[] | null
          allowed_services?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          encrypted_key_material: string
          id: string
          is_active?: boolean | null
          is_revoked?: boolean | null
          key_version?: number
          last_rotated_at?: string | null
          name: string
          next_rotation_at?: string | null
          revoked_at?: string | null
          rotation_enabled?: boolean | null
          rotation_interval_days?: number | null
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          algorithm?: string
          allowed_roles?: string[] | null
          allowed_services?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          encrypted_key_material?: string
          id?: string
          is_active?: boolean | null
          is_revoked?: boolean | null
          key_version?: number
          last_rotated_at?: string | null
          name?: string
          next_rotation_at?: string | null
          revoked_at?: string | null
          rotation_enabled?: boolean | null
          rotation_interval_days?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "encryption_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      failover_events: {
        Row: {
          actual_rpo_seconds: number | null
          actual_rto_seconds: number | null
          completed_at: string | null
          created_at: string | null
          current_step_id: string | null
          error_message: string | null
          id: string
          initiated_at: string
          metadata: Json | null
          plan_id: string
          rollback_at: string | null
          rollback_reason: string | null
          rolled_back: boolean | null
          source_region_id: string
          status: string
          steps_completed: number
          steps_failed: number
          target_region_id: string
          tenant_id: string
          trigger_reason: string
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actual_rpo_seconds?: number | null
          actual_rto_seconds?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          id: string
          initiated_at?: string
          metadata?: Json | null
          plan_id: string
          rollback_at?: string | null
          rollback_reason?: string | null
          rolled_back?: boolean | null
          source_region_id: string
          status: string
          steps_completed?: number
          steps_failed?: number
          target_region_id: string
          tenant_id: string
          trigger_reason: string
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actual_rpo_seconds?: number | null
          actual_rto_seconds?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          id?: string
          initiated_at?: string
          metadata?: Json | null
          plan_id?: string
          rollback_at?: string | null
          rollback_reason?: string | null
          rolled_back?: boolean | null
          source_region_id?: string
          status?: string
          steps_completed?: number
          steps_failed?: number
          target_region_id?: string
          tenant_id?: string
          trigger_reason?: string
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failover_events_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "failover_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failover_events_source_region_id_fkey"
            columns: ["source_region_id"]
            isOneToOne: false
            referencedRelation: "dr_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failover_events_target_region_id_fkey"
            columns: ["target_region_id"]
            isOneToOne: false
            referencedRelation: "dr_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failover_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      failover_plans: {
        Row: {
          created_at: string | null
          description: string | null
          failover_type: string
          id: string
          is_active: boolean | null
          last_failover_at: string | null
          last_tested_at: string | null
          name: string
          rpo_seconds: number
          rto_seconds: number
          source_region_id: string
          steps: Json
          target_region_id: string
          tenant_id: string
          triggers: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          failover_type: string
          id: string
          is_active?: boolean | null
          last_failover_at?: string | null
          last_tested_at?: string | null
          name: string
          rpo_seconds: number
          rto_seconds: number
          source_region_id: string
          steps?: Json
          target_region_id: string
          tenant_id: string
          triggers?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          failover_type?: string
          id?: string
          is_active?: boolean | null
          last_failover_at?: string | null
          last_tested_at?: string | null
          name?: string
          rpo_seconds?: number
          rto_seconds?: number
          source_region_id?: string
          steps?: Json
          target_region_id?: string
          tenant_id?: string
          triggers?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failover_plans_source_region_id_fkey"
            columns: ["source_region_id"]
            isOneToOne: false
            referencedRelation: "dr_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failover_plans_target_region_id_fkey"
            columns: ["target_region_id"]
            isOneToOne: false
            referencedRelation: "dr_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "failover_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gpu_allocation_requests: {
        Row: {
          created_at: string
          estimated_duration_minutes: number
          id: string
          max_cost_per_hour_usd: number | null
          max_latency_ms: number | null
          metadata: Json
          min_cuda_compute_capability: string | null
          model_name: string | null
          model_size_gb: number | null
          preferred_gpu_model: string | null
          priority: string
          required_gpus: number
          required_vram_gb: number
          requires_mig: boolean
          requires_multi_gpu: boolean
          task_id: string
          task_type: string
          tenant_id: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_duration_minutes?: number
          id: string
          max_cost_per_hour_usd?: number | null
          max_latency_ms?: number | null
          metadata?: Json
          min_cuda_compute_capability?: string | null
          model_name?: string | null
          model_size_gb?: number | null
          preferred_gpu_model?: string | null
          priority: string
          required_gpus?: number
          required_vram_gb: number
          requires_mig?: boolean
          requires_multi_gpu?: boolean
          task_id: string
          task_type: string
          tenant_id: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_duration_minutes?: number
          id?: string
          max_cost_per_hour_usd?: number | null
          max_latency_ms?: number | null
          metadata?: Json
          min_cuda_compute_capability?: string | null
          model_name?: string | null
          model_size_gb?: number | null
          preferred_gpu_model?: string | null
          priority?: string
          required_gpus?: number
          required_vram_gb?: number
          requires_mig?: boolean
          requires_multi_gpu?: boolean
          task_id?: string
          task_type?: string
          tenant_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gpu_allocation_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gpu_allocations: {
        Row: {
          actual_completion_at: string | null
          allocated_at: string
          average_temperature: number | null
          average_utilization: number | null
          cost_per_hour_usd: number
          estimated_completion_at: string | null
          gpu_ids: Json
          id: string
          metadata: Json
          mig_instance_ids: Json | null
          request_id: string
          status: string
          task_id: string
          tenant_id: string
          total_cost_usd: number | null
          total_vram_gb: number
        }
        Insert: {
          actual_completion_at?: string | null
          allocated_at?: string
          average_temperature?: number | null
          average_utilization?: number | null
          cost_per_hour_usd?: number
          estimated_completion_at?: string | null
          gpu_ids?: Json
          id: string
          metadata?: Json
          mig_instance_ids?: Json | null
          request_id: string
          status: string
          task_id: string
          tenant_id: string
          total_cost_usd?: number | null
          total_vram_gb: number
        }
        Update: {
          actual_completion_at?: string | null
          allocated_at?: string
          average_temperature?: number | null
          average_utilization?: number | null
          cost_per_hour_usd?: number
          estimated_completion_at?: string | null
          gpu_ids?: Json
          id?: string
          metadata?: Json
          mig_instance_ids?: Json | null
          request_id?: string
          status?: string
          task_id?: string
          tenant_id?: string
          total_cost_usd?: number | null
          total_vram_gb?: number
        }
        Relationships: [
          {
            foreignKeyName: "gpu_allocations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gpu_cost_records: {
        Row: {
          allocation_id: string
          cost_per_hour_usd: number
          duration_hours: number
          gpu_id: string
          id: string
          instance_type: string
          tenant_id: string
          timestamp: string
          total_cost_usd: number
          utilization_percent: number
        }
        Insert: {
          allocation_id: string
          cost_per_hour_usd?: number
          duration_hours?: number
          gpu_id: string
          id: string
          instance_type: string
          tenant_id: string
          timestamp?: string
          total_cost_usd?: number
          utilization_percent?: number
        }
        Update: {
          allocation_id?: string
          cost_per_hour_usd?: number
          duration_hours?: number
          gpu_id?: string
          id?: string
          instance_type?: string
          tenant_id?: string
          timestamp?: string
          total_cost_usd?: number
          utilization_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "gpu_cost_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gpu_hardware: {
        Row: {
          allocated_to_task_id: string | null
          created_at: string
          cuda_compute_capability: string
          cuda_cores: number
          cuda_version: string
          current_allocation_id: string | null
          driver_version: string
          error_count: number
          id: string
          last_error_at: string | null
          last_health_check_at: string
          location: string
          memory_bandwidth_gb_ps: number
          memory_free_gb: number
          memory_used_gb: number
          mig_instances: Json
          model: string
          node_id: string
          pci_bus_id: string
          power_usage_watts: number
          state: string
          supports_bf16: boolean
          supports_fp8: boolean
          supports_mig: boolean
          tdp_watts: number
          temperature_celsius: number
          tensor_cores: number
          updated_at: string
          utilization_percent: number
          uuid: string
          vendor: string
          vram_gb: number
        }
        Insert: {
          allocated_to_task_id?: string | null
          created_at?: string
          cuda_compute_capability?: string
          cuda_cores?: number
          cuda_version?: string
          current_allocation_id?: string | null
          driver_version?: string
          error_count?: number
          id: string
          last_error_at?: string | null
          last_health_check_at?: string
          location?: string
          memory_bandwidth_gb_ps?: number
          memory_free_gb?: number
          memory_used_gb?: number
          mig_instances?: Json
          model: string
          node_id: string
          pci_bus_id?: string
          power_usage_watts?: number
          state: string
          supports_bf16?: boolean
          supports_fp8?: boolean
          supports_mig?: boolean
          tdp_watts?: number
          temperature_celsius?: number
          tensor_cores?: number
          updated_at?: string
          utilization_percent?: number
          uuid: string
          vendor: string
          vram_gb: number
        }
        Update: {
          allocated_to_task_id?: string | null
          created_at?: string
          cuda_compute_capability?: string
          cuda_cores?: number
          cuda_version?: string
          current_allocation_id?: string | null
          driver_version?: string
          error_count?: number
          id?: string
          last_error_at?: string | null
          last_health_check_at?: string
          location?: string
          memory_bandwidth_gb_ps?: number
          memory_free_gb?: number
          memory_used_gb?: number
          mig_instances?: Json
          model?: string
          node_id?: string
          pci_bus_id?: string
          power_usage_watts?: number
          state?: string
          supports_bf16?: boolean
          supports_fp8?: boolean
          supports_mig?: boolean
          tdp_watts?: number
          temperature_celsius?: number
          tensor_cores?: number
          updated_at?: string
          utilization_percent?: number
          uuid?: string
          vendor?: string
          vram_gb?: number
        }
        Relationships: []
      }
      gpu_health_metrics: {
        Row: {
          alerts: Json
          clock_speed_mhz: number
          ecc_errors: number
          fan_speed_percent: number
          gpu_id: string
          health_score: number
          id: number
          memory_free_gb: number
          memory_used_gb: number
          power_throttling: boolean
          power_usage_watts: number
          temperature_celsius: number
          thermal_throttling: boolean
          timestamp: string
          utilization_percent: number
          xid_errors: number
        }
        Insert: {
          alerts?: Json
          clock_speed_mhz?: number
          ecc_errors?: number
          fan_speed_percent?: number
          gpu_id: string
          health_score?: number
          id?: number
          memory_free_gb?: number
          memory_used_gb?: number
          power_throttling?: boolean
          power_usage_watts?: number
          temperature_celsius?: number
          thermal_throttling?: boolean
          timestamp?: string
          utilization_percent?: number
          xid_errors?: number
        }
        Update: {
          alerts?: Json
          clock_speed_mhz?: number
          ecc_errors?: number
          fan_speed_percent?: number
          gpu_id?: string
          health_score?: number
          id?: number
          memory_free_gb?: number
          memory_used_gb?: number
          power_throttling?: boolean
          power_usage_watts?: number
          temperature_celsius?: number
          thermal_throttling?: boolean
          timestamp?: string
          utilization_percent?: number
          xid_errors?: number
        }
        Relationships: []
      }
      gpu_queue: {
        Row: {
          estimated_wait_time_minutes: number
          id: string
          priority: string
          queued_at: string
          request_id: string
          required_gpus: number
          required_vram_gb: number
          score: number
          status: string
        }
        Insert: {
          estimated_wait_time_minutes?: number
          id: string
          priority: string
          queued_at?: string
          request_id: string
          required_gpus: number
          required_vram_gb: number
          score?: number
          status: string
        }
        Update: {
          estimated_wait_time_minutes?: number
          id?: string
          priority?: string
          queued_at?: string
          request_id?: string
          required_gpus?: number
          required_vram_gb?: number
          score?: number
          status?: string
        }
        Relationships: []
      }
      gpu_scheduling_policies: {
        Row: {
          allocation_strategy: string
          created_at: string
          description: string | null
          enable_automatic_failover: boolean
          enable_gpu_sharing: boolean
          enable_mig: boolean
          id: string
          is_active: boolean
          max_power_usage_percent: number
          max_spot_price_multiplier: number
          max_temperature_celsius: number
          max_utilization_threshold: number
          name: string
          prefer_spot_instances: boolean
          priority_weights: Json
          reserved_instance_utilization_target: number
          updated_at: string
        }
        Insert: {
          allocation_strategy: string
          created_at?: string
          description?: string | null
          enable_automatic_failover?: boolean
          enable_gpu_sharing?: boolean
          enable_mig?: boolean
          id: string
          is_active?: boolean
          max_power_usage_percent?: number
          max_spot_price_multiplier?: number
          max_temperature_celsius?: number
          max_utilization_threshold?: number
          name: string
          prefer_spot_instances?: boolean
          priority_weights?: Json
          reserved_instance_utilization_target?: number
          updated_at?: string
        }
        Update: {
          allocation_strategy?: string
          created_at?: string
          description?: string | null
          enable_automatic_failover?: boolean
          enable_gpu_sharing?: boolean
          enable_mig?: boolean
          id?: string
          is_active?: boolean
          max_power_usage_percent?: number
          max_spot_price_multiplier?: number
          max_temperature_celsius?: number
          max_utilization_threshold?: number
          name?: string
          prefer_spot_instances?: boolean
          priority_weights?: Json
          reserved_instance_utilization_target?: number
          updated_at?: string
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
      health_anomalies: {
        Row: {
          current_value: number
          description: string
          detected_at: string
          expected_baseline: number
          id: string
          instance_id: string
          metric_name: string
          severity: string
        }
        Insert: {
          current_value: number
          description: string
          detected_at?: string
          expected_baseline: number
          id: string
          instance_id: string
          metric_name: string
          severity: string
        }
        Update: {
          current_value?: number
          description?: string
          detected_at?: string
          expected_baseline?: number
          id?: string
          instance_id?: string
          metric_name?: string
          severity?: string
        }
        Relationships: []
      }
      installed_tools: {
        Row: {
          installed_at: string
          mcp_server_id: string | null
          name: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          installed_at?: string
          mcp_server_id?: string | null
          name: string
          status: string
          updated_at?: string
          version: string
        }
        Update: {
          installed_at?: string
          mcp_server_id?: string | null
          name?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      key_rotation_events: {
        Row: {
          created_at: string
          from_version: number
          id: string
          key_id: string
          metadata: Json | null
          reason: string
          rotated_at: string
          rotated_by: string
          tenant_id: string
          to_version: number
        }
        Insert: {
          created_at?: string
          from_version: number
          id: string
          key_id: string
          metadata?: Json | null
          reason: string
          rotated_at: string
          rotated_by: string
          tenant_id: string
          to_version: number
        }
        Update: {
          created_at?: string
          from_version?: number
          id?: string
          key_id?: string
          metadata?: Json | null
          reason?: string
          rotated_at?: string
          rotated_by?: string
          tenant_id?: string
          to_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "key_rotation_events_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "encryption_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_rotation_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_versions: {
        Row: {
          author_id: string
          author_type: string
          change_summary: string
          change_type: string
          content: string
          created_at: string
          embedding: string | null
          entity_id: string
          entity_type: string
          id: string
          is_current_version: boolean
          metadata: Json
          parent_version_id: string | null
          version_number: number
        }
        Insert: {
          author_id: string
          author_type: string
          change_summary: string
          change_type: string
          content: string
          created_at?: string
          embedding?: string | null
          entity_id: string
          entity_type: string
          id: string
          is_current_version?: boolean
          metadata?: Json
          parent_version_id?: string | null
          version_number: number
        }
        Update: {
          author_id?: string
          author_type?: string
          change_summary?: string
          change_type?: string
          content?: string
          created_at?: string
          embedding?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_current_version?: boolean
          metadata?: Json
          parent_version_id?: string | null
          version_number?: number
        }
        Relationships: []
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
      legal_holds: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          placed_at: string
          reason: string
          requested_by: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          placed_at?: string
          reason: string
          requested_by: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          placed_at?: string
          reason?: string
          requested_by?: string
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
      marketplace_listings: {
        Row: {
          author: string
          category: string
          created_at: string
          description: string
          downloads: number
          is_verified: boolean
          manifest_json: Json
          name: string
          rating: number
          tags: string[]
          updated_at: string
          version: string
        }
        Insert: {
          author: string
          category: string
          created_at?: string
          description: string
          downloads?: number
          is_verified?: boolean
          manifest_json: Json
          name: string
          rating?: number
          tags?: string[]
          updated_at?: string
          version: string
        }
        Update: {
          author?: string
          category?: string
          created_at?: string
          description?: string
          downloads?: number
          is_verified?: boolean
          manifest_json?: Json
          name?: string
          rating?: number
          tags?: string[]
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      mcp_server_connections: {
        Row: {
          allowed_tools: string[]
          api_key_secret_name: string | null
          created_at: string
          endpoint: string
          error_message: string | null
          exposed_resources: Json
          exposed_tools: Json
          last_heartbeat: string | null
          name: string
          server_id: string
          status: string
          transport_type: string
          updated_at: string
        }
        Insert: {
          allowed_tools?: string[]
          api_key_secret_name?: string | null
          created_at?: string
          endpoint: string
          error_message?: string | null
          exposed_resources?: Json
          exposed_tools?: Json
          last_heartbeat?: string | null
          name: string
          server_id: string
          status: string
          transport_type: string
          updated_at?: string
        }
        Update: {
          allowed_tools?: string[]
          api_key_secret_name?: string | null
          created_at?: string
          endpoint?: string
          error_message?: string | null
          exposed_resources?: Json
          exposed_tools?: Json
          last_heartbeat?: string | null
          name?: string
          server_id?: string
          status?: string
          transport_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      mcp_tool_executions: {
        Row: {
          agent_name: string | null
          arguments: Json
          created_at: string
          execution_time_ms: number | null
          id: string
          result_summary: string | null
          server_id: string
          success: boolean
          tool_name: string
        }
        Insert: {
          agent_name?: string | null
          arguments?: Json
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          result_summary?: string | null
          server_id: string
          success: boolean
          tool_name: string
        }
        Update: {
          agent_name?: string | null
          arguments?: Json
          created_at?: string
          execution_time_ms?: number | null
          id?: string
          result_summary?: string | null
          server_id?: string
          success?: boolean
          tool_name?: string
        }
        Relationships: []
      }
      member_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status: string
          team_ids: string[]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          status?: string
          team_ids?: string[]
          tenant_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          team_ids?: string[]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      memory_promotions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          id: string
          justification: string
          proposed_access_level: string
          proposed_content: string
          requested_at: string
          requested_by: string
          source_department: string | null
          source_memory_id: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          id: string
          justification: string
          proposed_access_level: string
          proposed_content: string
          requested_at?: string
          requested_by: string
          source_department?: string | null
          source_memory_id?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          justification?: string
          proposed_access_level?: string
          proposed_content?: string
          requested_at?: string
          requested_by?: string
          source_department?: string | null
          source_memory_id?: string | null
          status?: string
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
      model_cost_records: {
        Row: {
          id: string
          input_cost_usd: number
          input_tokens: number
          latency_ms: number
          model_id: string
          output_cost_usd: number
          output_tokens: number
          request_id: string
          success: boolean
          tenant_id: string
          timestamp: string
          total_cost_usd: number
          total_tokens: number
        }
        Insert: {
          id: string
          input_cost_usd: number
          input_tokens: number
          latency_ms: number
          model_id: string
          output_cost_usd: number
          output_tokens: number
          request_id: string
          success: boolean
          tenant_id: string
          timestamp?: string
          total_cost_usd: number
          total_tokens: number
        }
        Update: {
          id?: string
          input_cost_usd?: number
          input_tokens?: number
          latency_ms?: number
          model_id?: string
          output_cost_usd?: number
          output_tokens?: number
          request_id?: string
          success?: boolean
          tenant_id?: string
          timestamp?: string
          total_cost_usd?: number
          total_tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "model_cost_records_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_cost_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      model_fallback_events: {
        Row: {
          fallback_model_id: string
          id: string
          original_model_id: string
          reason: string
          request_id: string
          resolved_at: string | null
          success: boolean
          triggered_at: string
        }
        Insert: {
          fallback_model_id: string
          id: string
          original_model_id: string
          reason: string
          request_id: string
          resolved_at?: string | null
          success: boolean
          triggered_at?: string
        }
        Update: {
          fallback_model_id?: string
          id?: string
          original_model_id?: string
          reason?: string
          request_id?: string
          resolved_at?: string | null
          success?: boolean
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_fallback_events_fallback_model_id_fkey"
            columns: ["fallback_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_fallback_events_original_model_id_fkey"
            columns: ["original_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_routing_decisions: {
        Row: {
          estimated_cost_usd: number
          estimated_latency_ms: number
          id: string
          processing_time_ms: number
          reasoning: string
          routing_rule_id: string | null
          score: number
          selected_model_id: string
          strategy: string
          task_complexity: string | null
          task_type: string
          tenant_id: string
          timestamp: string
        }
        Insert: {
          estimated_cost_usd: number
          estimated_latency_ms: number
          id: string
          processing_time_ms: number
          reasoning: string
          routing_rule_id?: string | null
          score: number
          selected_model_id: string
          strategy: string
          task_complexity?: string | null
          task_type: string
          tenant_id: string
          timestamp?: string
        }
        Update: {
          estimated_cost_usd?: number
          estimated_latency_ms?: number
          id?: string
          processing_time_ms?: number
          reasoning?: string
          routing_rule_id?: string | null
          score?: number
          selected_model_id?: string
          strategy?: string
          task_complexity?: string | null
          task_type?: string
          tenant_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_routing_decisions_routing_rule_id_fkey"
            columns: ["routing_rule_id"]
            isOneToOne: false
            referencedRelation: "model_routing_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_routing_decisions_selected_model_id_fkey"
            columns: ["selected_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_routing_decisions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      model_routing_rules: {
        Row: {
          conditions: Json
          created_at: string | null
          description: string | null
          fallback_model_ids: string[] | null
          fallback_strategy: string
          id: string
          is_active: boolean | null
          logic: string
          max_cost_per_request_usd: number | null
          max_latency_ms: number | null
          min_confidence_score: number | null
          name: string
          primary_model_id: string
          priority: number
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          conditions?: Json
          created_at?: string | null
          description?: string | null
          fallback_model_ids?: string[] | null
          fallback_strategy?: string
          id: string
          is_active?: boolean | null
          logic?: string
          max_cost_per_request_usd?: number | null
          max_latency_ms?: number | null
          min_confidence_score?: number | null
          name: string
          primary_model_id: string
          priority?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          conditions?: Json
          created_at?: string | null
          description?: string | null
          fallback_model_ids?: string[] | null
          fallback_strategy?: string
          id?: string
          is_active?: boolean | null
          logic?: string
          max_cost_per_request_usd?: number | null
          max_latency_ms?: number | null
          min_confidence_score?: number | null
          name?: string
          primary_model_id?: string
          priority?: number
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_routing_rules_primary_model_id_fkey"
            columns: ["primary_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_routing_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      orchestrated_tasks: {
        Row: {
          attempts: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          depends_on: Json
          error: string | null
          error_code: string | null
          id: string
          max_attempts: number
          metadata: Json
          next_retry_at: string | null
          payload: Json
          priority: number
          queue_id: string
          queued_at: string | null
          result: Json | null
          retry_delay_ms: number
          retry_strategy: string
          started_at: string | null
          state: string
          tenant_id: string
          timeout_ms: number
          type: string
          workspace_id: string | null
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          depends_on?: Json
          error?: string | null
          error_code?: string | null
          id: string
          max_attempts?: number
          metadata?: Json
          next_retry_at?: string | null
          payload?: Json
          priority?: number
          queue_id: string
          queued_at?: string | null
          result?: Json | null
          retry_delay_ms?: number
          retry_strategy?: string
          started_at?: string | null
          state?: string
          tenant_id: string
          timeout_ms?: number
          type: string
          workspace_id?: string | null
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          depends_on?: Json
          error?: string | null
          error_code?: string | null
          id?: string
          max_attempts?: number
          metadata?: Json
          next_retry_at?: string | null
          payload?: Json
          priority?: number
          queue_id?: string
          queued_at?: string | null
          result?: Json | null
          retry_delay_ms?: number
          retry_strategy?: string
          started_at?: string | null
          state?: string
          tenant_id?: string
          timeout_ms?: number
          type?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orchestrated_tasks_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orchestrated_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          email: string
          id: string
          joined_at: string
          last_active_at: string | null
          metadata: Json
          role: string
          status: string
          team_ids: string[]
          tenant_id: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          email: string
          id: string
          joined_at?: string
          last_active_at?: string | null
          metadata?: Json
          role: string
          status?: string
          team_ids?: string[]
          tenant_id: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          email?: string
          id?: string
          joined_at?: string
          last_active_at?: string | null
          metadata?: Json
          role?: string
          status?: string
          team_ids?: string[]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system_role: boolean
          name: string
          permissions: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_system_role?: boolean
          name: string
          permissions?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system_role?: boolean
          name?: string
          permissions?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          allow_member_invites: boolean
          custom_domains: string[]
          default_role: string
          display_name: string
          ip_allowlist: string[]
          logo_url: string | null
          require_email_verification: boolean
          session_timeout_minutes: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allow_member_invites?: boolean
          custom_domains?: string[]
          default_role?: string
          display_name: string
          ip_allowlist?: string[]
          logo_url?: string | null
          require_email_verification?: boolean
          session_timeout_minutes?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allow_member_invites?: boolean
          custom_domains?: string[]
          default_role?: string
          display_name?: string
          ip_allowlist?: string[]
          logo_url?: string | null
          require_email_verification?: boolean
          session_timeout_minutes?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_teams: {
        Row: {
          child_team_count: number
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          level: number
          member_count: number
          metadata: Json
          name: string
          parent_team_id: string | null
          path: string | null
          resource_quota: Json
          settings: Json
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          child_team_count?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          id: string
          level?: number
          member_count?: number
          metadata?: Json
          name: string
          parent_team_id?: string | null
          path?: string | null
          resource_quota?: Json
          settings?: Json
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          child_team_count?: number
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          level?: number
          member_count?: number
          metadata?: Json
          name?: string
          parent_team_id?: string | null
          path?: string | null
          resource_quota?: Json
          settings?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "organization_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          id: string
          is_active: boolean
          monthly_price_usd: number
          name: string
          quotas: Json
          stripe_monthly_price_id: string | null
          stripe_yearly_price_id: string | null
          tier: string
          updated_at: string
          yearly_price_usd: number
        }
        Insert: {
          created_at?: string
          description?: string
          features?: Json
          id: string
          is_active?: boolean
          monthly_price_usd?: number
          name: string
          quotas?: Json
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          tier: string
          updated_at?: string
          yearly_price_usd?: number
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price_usd?: number
          name?: string
          quotas?: Json
          stripe_monthly_price_id?: string | null
          stripe_yearly_price_id?: string | null
          tier?: string
          updated_at?: string
          yearly_price_usd?: number
        }
        Relationships: []
      }
      project_members: {
        Row: {
          granted_at: string
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_memories: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          project_id: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id: string
          metadata?: Json
          project_id: string
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          project_id?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          active_phase: string
          client_name: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          active_phase?: string
          client_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          active_phase?: string
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      queue_metrics: {
        Row: {
          avg_processing_time_ms: number
          avg_wait_time_ms: number
          completed_tasks: number
          dead_letter_tasks: number
          failed_tasks: number
          failure_rate: number
          id: string
          oldest_pending_task_age: number
          p95_processing_time_ms: number
          p99_processing_time_ms: number
          pending_tasks: number
          processing_tasks: number
          queue_id: string
          success_rate: number
          tasks_per_minute: number
          timestamp: string
        }
        Insert: {
          avg_processing_time_ms?: number
          avg_wait_time_ms?: number
          completed_tasks?: number
          dead_letter_tasks?: number
          failed_tasks?: number
          failure_rate?: number
          id: string
          oldest_pending_task_age?: number
          p95_processing_time_ms?: number
          p99_processing_time_ms?: number
          pending_tasks?: number
          processing_tasks?: number
          queue_id: string
          success_rate?: number
          tasks_per_minute?: number
          timestamp?: string
        }
        Update: {
          avg_processing_time_ms?: number
          avg_wait_time_ms?: number
          completed_tasks?: number
          dead_letter_tasks?: number
          failed_tasks?: number
          failure_rate?: number
          id?: string
          oldest_pending_task_age?: number
          p95_processing_time_ms?: number
          p99_processing_time_ms?: number
          pending_tasks?: number
          processing_tasks?: number
          queue_id?: string
          success_rate?: number
          tasks_per_minute?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_metrics_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "queues"
            referencedColumns: ["id"]
          },
        ]
      }
      queues: {
        Row: {
          created_at: string
          current_depth: number
          default_max_retries: number
          default_retry_strategy: string
          default_timeout_ms: number
          description: string | null
          failure_rate: number
          id: string
          is_active: boolean
          max_concurrent_tasks: number
          name: string
          processing_rate: number
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_depth?: number
          default_max_retries?: number
          default_retry_strategy?: string
          default_timeout_ms?: number
          description?: string | null
          failure_rate?: number
          id: string
          is_active?: boolean
          max_concurrent_tasks?: number
          name: string
          processing_rate?: number
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_depth?: number
          default_max_retries?: number
          default_retry_strategy?: string
          default_timeout_ms?: number
          description?: string | null
          failure_rate?: number
          id?: string
          is_active?: boolean
          max_concurrent_tasks?: number
          name?: string
          processing_rate?: number
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "queues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      rbac_audit_logs: {
        Row: {
          action: string
          details: Json
          id: string
          ip_address: string | null
          tenant_id: string
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          details?: Json
          id: string
          ip_address?: string | null
          tenant_id: string
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          details?: Json
          id?: string
          ip_address?: string | null
          tenant_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_permissions: {
        Row: {
          action: string
          created_at: string
          description: string
          id: string
          is_system: boolean
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description: string
          id: string
          is_system?: boolean
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          resource?: string
        }
        Relationships: []
      }
      rbac_role_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          metadata: Json
          role_id: string
          tenant_id: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          expires_at?: string | null
          id: string
          is_active?: boolean
          metadata?: Json
          role_id: string
          tenant_id: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          role_id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rbac_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbac_role_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_roles: {
        Row: {
          created_at: string
          current_member_count: number
          description: string | null
          effective_permissions: string[]
          id: string
          inherits_permissions: boolean
          is_active: boolean
          is_system_role: boolean
          max_members: number | null
          name: string
          parent_role_id: string | null
          permissions: string[]
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_member_count?: number
          description?: string | null
          effective_permissions?: string[]
          id: string
          inherits_permissions?: boolean
          is_active?: boolean
          is_system_role?: boolean
          max_members?: number | null
          name: string
          parent_role_id?: string | null
          permissions?: string[]
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_member_count?: number
          description?: string | null
          effective_permissions?: string[]
          id?: string
          inherits_permissions?: boolean
          is_active?: boolean
          is_system_role?: boolean
          max_members?: number | null
          name?: string
          parent_role_id?: string | null
          permissions?: string[]
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_roles_parent_role_id_fkey"
            columns: ["parent_role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rbac_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      restore_jobs: {
        Row: {
          backup_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json
          overwrite_existing: boolean
          post_restore_verification: boolean
          progress: number
          restore_to_timestamp: string | null
          restored_file_count: number
          restored_size_bytes: number
          started_at: string | null
          status: string
          target_database: string | null
          target_path: string | null
          tenant_id: string
          updated_at: string
          verification_result: string | null
        }
        Insert: {
          backup_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          overwrite_existing?: boolean
          post_restore_verification?: boolean
          progress?: number
          restore_to_timestamp?: string | null
          restored_file_count?: number
          restored_size_bytes?: number
          started_at?: string | null
          status?: string
          target_database?: string | null
          target_path?: string | null
          tenant_id: string
          updated_at?: string
          verification_result?: string | null
        }
        Update: {
          backup_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json
          overwrite_existing?: boolean
          post_restore_verification?: boolean
          progress?: number
          restore_to_timestamp?: string | null
          restored_file_count?: number
          restored_size_bytes?: number
          started_at?: string | null
          status?: string
          target_database?: string | null
          target_path?: string | null
          tenant_id?: string
          updated_at?: string
          verification_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restore_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_policies: {
        Row: {
          action_after_retention: string
          applies_to: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          legal_hold_capable: boolean
          name: string
          retention_days: number
        }
        Insert: {
          action_after_retention: string
          applies_to: Json
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          legal_hold_capable?: boolean
          name: string
          retention_days: number
        }
        Update: {
          action_after_retention?: string
          applies_to?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          legal_hold_capable?: boolean
          name?: string
          retention_days?: number
        }
        Relationships: []
      }
      retrieval_events: {
        Row: {
          avg_relevance_score: number
          estimated_cost_usd: number
          id: string
          latency_ms: number
          memory_ids_fetched: string[]
          query_text: string
          results_returned: number
          source: string
          timestamp: string
          tokens_consumed: number
        }
        Insert: {
          avg_relevance_score?: number
          estimated_cost_usd: number
          id: string
          latency_ms: number
          memory_ids_fetched?: string[]
          query_text: string
          results_returned: number
          source: string
          timestamp?: string
          tokens_consumed: number
        }
        Update: {
          avg_relevance_score?: number
          estimated_cost_usd?: number
          id?: string
          latency_ms?: number
          memory_ids_fetched?: string[]
          query_text?: string
          results_returned?: number
          source?: string
          timestamp?: string
          tokens_consumed?: number
        }
        Relationships: []
      }
      sandbox_executions: {
        Row: {
          agent_id: string
          created_at: string
          execution_time_ms: number
          exit_code: number
          id: string
          memory_used_mb: number
          stderr: string | null
          success: boolean
          tool_name: string
          tool_version: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          execution_time_ms: number
          exit_code: number
          id?: string
          memory_used_mb: number
          stderr?: string | null
          success: boolean
          tool_name: string
          tool_version: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          execution_time_ms?: number
          exit_code?: number
          id?: string
          memory_used_mb?: number
          stderr?: string | null
          success?: boolean
          tool_name?: string
          tool_version?: string
        }
        Relationships: []
      }
      sandbox_security_violations: {
        Row: {
          created_at: string
          details: string
          execution_id: string | null
          id: string
          tool_name: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          details: string
          execution_id?: string | null
          id?: string
          tool_name: string
          violation_type: string
        }
        Update: {
          created_at?: string
          details?: string
          execution_id?: string | null
          id?: string
          tool_name?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sandbox_security_violations_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "sandbox_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      scaling_events: {
        Row: {
          completed_at: string | null
          direction: string
          error: string | null
          estimated_cost_change_usd: number | null
          id: string
          initiated_at: string
          instances_after: number
          instances_before: number
          metadata: Json
          metric_value: number
          policy_id: string
          reason: string
          status: string
          threshold_value: number
          trigger: string
        }
        Insert: {
          completed_at?: string | null
          direction: string
          error?: string | null
          estimated_cost_change_usd?: number | null
          id: string
          initiated_at: string
          instances_after: number
          instances_before: number
          metadata?: Json
          metric_value: number
          policy_id: string
          reason: string
          status: string
          threshold_value: number
          trigger: string
        }
        Update: {
          completed_at?: string | null
          direction?: string
          error?: string | null
          estimated_cost_change_usd?: number | null
          id?: string
          initiated_at?: string
          instances_after?: number
          instances_before?: number
          metadata?: Json
          metric_value?: number
          policy_id?: string
          reason?: string
          status?: string
          threshold_value?: number
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaling_events_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "scaling_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      scaling_metrics: {
        Row: {
          cpu_usage_percent: number
          current_instances: number
          custom_metrics: Json
          desired_instances: number
          id: string
          memory_usage_percent: number
          policy_id: string
          queue_depth: number
          requests_per_second: number
          timestamp: string
        }
        Insert: {
          cpu_usage_percent: number
          current_instances: number
          custom_metrics?: Json
          desired_instances: number
          id: string
          memory_usage_percent: number
          policy_id: string
          queue_depth?: number
          requests_per_second?: number
          timestamp: string
        }
        Update: {
          cpu_usage_percent?: number
          current_instances?: number
          custom_metrics?: Json
          desired_instances?: number
          id?: string
          memory_usage_percent?: number
          policy_id?: string
          queue_depth?: number
          requests_per_second?: number
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaling_metrics_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "scaling_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      scaling_policies: {
        Row: {
          cloud_provider: string
          created_at: string
          current_instances: number
          description: string | null
          desired_instances: number
          id: string
          last_scaled_at: string | null
          max_instances: number
          min_instances: number
          name: string
          scale_down_cooldown_seconds: number
          scale_up_cooldown_seconds: number
          stabilization_window_seconds: number
          status: string
          target_resource_id: string
          target_resource_type: string
          trigger_configs: Json
          triggers: string[]
          updated_at: string
        }
        Insert: {
          cloud_provider: string
          created_at?: string
          current_instances?: number
          description?: string | null
          desired_instances?: number
          id: string
          last_scaled_at?: string | null
          max_instances?: number
          min_instances?: number
          name: string
          scale_down_cooldown_seconds?: number
          scale_up_cooldown_seconds?: number
          stabilization_window_seconds?: number
          status?: string
          target_resource_id: string
          target_resource_type: string
          trigger_configs?: Json
          triggers?: string[]
          updated_at?: string
        }
        Update: {
          cloud_provider?: string
          created_at?: string
          current_instances?: number
          description?: string | null
          desired_instances?: number
          id?: string
          last_scaled_at?: string | null
          max_instances?: number
          min_instances?: number
          name?: string
          scale_down_cooldown_seconds?: number
          scale_up_cooldown_seconds?: number
          stabilization_window_seconds?: number
          status?: string
          target_resource_id?: string
          target_resource_type?: string
          trigger_configs?: Json
          triggers?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      scaling_predictions: {
        Row: {
          confidence_score: number
          generated_at: string
          id: string
          policy_id: string
          predicted_instances_needed: number
          predicted_metric_value: number
          predicted_timestamp: string
        }
        Insert: {
          confidence_score: number
          generated_at: string
          id: string
          policy_id: string
          predicted_instances_needed: number
          predicted_metric_value: number
          predicted_timestamp: string
        }
        Update: {
          confidence_score?: number
          generated_at?: string
          id?: string
          policy_id?: string
          predicted_instances_needed?: number
          predicted_metric_value?: number
          predicted_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "scaling_predictions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "scaling_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_access_requests: {
        Row: {
          access_expires_at: string | null
          access_granted_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          ip_address: string | null
          reason: string
          rejection_reason: string | null
          requested_by: string
          requested_duration: number | null
          secret_id: string
          status: string
          tenant_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id: string
          ip_address?: string | null
          reason: string
          rejection_reason?: string | null
          requested_by: string
          requested_duration?: number | null
          secret_id: string
          status?: string
          tenant_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          access_expires_at?: string | null
          access_granted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string
          rejection_reason?: string | null
          requested_by?: string
          requested_duration?: number | null
          secret_id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secret_access_requests_secret_id_fkey"
            columns: ["secret_id"]
            isOneToOne: false
            referencedRelation: "secrets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secret_access_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_versions: {
        Row: {
          created_at: string
          created_by: string
          encrypted_value: string
          encryption_key_id: string
          id: string
          rotated_by: string | null
          rotation_reason: string | null
          secret_id: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          encrypted_value: string
          encryption_key_id: string
          id: string
          rotated_by?: string | null
          rotation_reason?: string | null
          secret_id: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string
          encrypted_value?: string
          encryption_key_id?: string
          id?: string
          rotated_by?: string | null
          rotation_reason?: string | null
          secret_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "secret_versions_secret_id_fkey"
            columns: ["secret_id"]
            isOneToOne: false
            referencedRelation: "secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets: {
        Row: {
          access_count: number
          access_policy: Json
          created_at: string
          created_by: string
          description: string | null
          encrypted_value: string
          encryption_algorithm: string
          encryption_key_id: string
          expires_at: string | null
          id: string
          is_revoked: boolean
          last_accessed_at: string | null
          last_accessed_by: string | null
          last_rotated_at: string | null
          metadata: Json
          name: string
          next_rotation_at: string | null
          previous_version_id: string | null
          revoked_at: string | null
          revoked_by: string | null
          rotation_enabled: boolean
          rotation_interval_days: number | null
          rotation_status: string
          tags: string[]
          tenant_id: string
          type: string
          updated_at: string
          version: number
          workspace_id: string | null
        }
        Insert: {
          access_count?: number
          access_policy?: Json
          created_at?: string
          created_by: string
          description?: string | null
          encrypted_value: string
          encryption_algorithm?: string
          encryption_key_id?: string
          expires_at?: string | null
          id: string
          is_revoked?: boolean
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          last_rotated_at?: string | null
          metadata?: Json
          name: string
          next_rotation_at?: string | null
          previous_version_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_enabled?: boolean
          rotation_interval_days?: number | null
          rotation_status?: string
          tags?: string[]
          tenant_id: string
          type?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Update: {
          access_count?: number
          access_policy?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          encrypted_value?: string
          encryption_algorithm?: string
          encryption_key_id?: string
          expires_at?: string | null
          id?: string
          is_revoked?: boolean
          last_accessed_at?: string | null
          last_accessed_by?: string | null
          last_rotated_at?: string | null
          metadata?: Json
          name?: string
          next_rotation_at?: string | null
          previous_version_id?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          rotation_enabled?: boolean
          rotation_interval_days?: number | null
          rotation_status?: string
          tags?: string[]
          tenant_id?: string
          type?: string
          updated_at?: string
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secrets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_memories: {
        Row: {
          access_level: string
          approved_at: string | null
          approved_by: string | null
          author_id: string
          category: string
          content: string
          created_at: string
          embedding: string | null
          id: string
          origin: string
          source_department: string | null
          source_memory_id: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          access_level: string
          approved_at?: string | null
          approved_by?: string | null
          author_id: string
          category: string
          content: string
          created_at?: string
          embedding?: string | null
          id: string
          origin: string
          source_department?: string | null
          source_memory_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          access_level?: string
          approved_at?: string | null
          approved_by?: string | null
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          origin?: string
          source_department?: string | null
          source_memory_id?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tenant_id: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          usage: Json
        }
        Insert: {
          billing_cycle: string
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          usage?: Json
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tenant_id?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          condition: string | null
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          resolved_at: string | null
          task_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id: string
          resolved_at?: string | null
          task_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          resolved_at?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "orchestrated_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "orchestrated_tasks"
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
      team_budget_usage: {
        Row: {
          amount_usd: number
          id: string
          recorded_at: string
          resource_type: string | null
          team_id: string
        }
        Insert: {
          amount_usd: number
          id?: string
          recorded_at?: string
          resource_type?: string | null
          team_id: string
        }
        Update: {
          amount_usd?: number
          id?: string
          recorded_at?: string
          resource_type?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_budget_usage_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "organization_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_channels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          last_message_at: string | null
          member_ids: string[]
          message_count: number
          name: string
          team_id: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          last_message_at?: string | null
          member_ids?: string[]
          message_count?: number
          name: string
          team_id: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          last_message_at?: string | null
          member_ids?: string[]
          message_count?: number
          name?: string
          team_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_channels_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "organization_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          attachments: string[]
          channel_id: string
          content: string
          created_at: string
          edited_at: string | null
          id: string
          mentions: string[]
          reactions: Json
          reply_to_id: string | null
          sender_id: string
          sender_name: string
        }
        Insert: {
          attachments?: string[]
          channel_id: string
          content: string
          created_at?: string
          edited_at?: string | null
          id: string
          mentions?: string[]
          reactions?: Json
          reply_to_id?: string | null
          sender_id: string
          sender_name: string
        }
        Update: {
          attachments?: string[]
          channel_id?: string
          content?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          mentions?: string[]
          reactions?: Json
          reply_to_id?: string | null
          sender_id?: string
          sender_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "team_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          updated_at?: string
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
      tool_cost_events: {
        Row: {
          agent_id: string
          cost_breakdown: Json
          department: string
          execution_time_ms: number
          id: string
          memory_used_mb: number
          timestamp: string
          tokens_used: Json | null
          tool_name: string
          total_cost_usd: number
        }
        Insert: {
          agent_id: string
          cost_breakdown: Json
          department: string
          execution_time_ms: number
          id: string
          memory_used_mb: number
          timestamp?: string
          tokens_used?: Json | null
          tool_name: string
          total_cost_usd: number
        }
        Update: {
          agent_id?: string
          cost_breakdown?: Json
          department?: string
          execution_time_ms?: number
          id?: string
          memory_used_mb?: number
          timestamp?: string
          tokens_used?: Json | null
          tool_name?: string
          total_cost_usd?: number
        }
        Relationships: []
      }
      tool_execution_events: {
        Row: {
          agent_id: string
          cost_usd: number
          department: string
          error_code: string | null
          id: string
          latency_ms: number
          payload_size_bytes: number | null
          success: boolean
          tenant_id: string | null
          timestamp: string
          tokens_used: number | null
          tool_name: string
        }
        Insert: {
          agent_id: string
          cost_usd?: number
          department: string
          error_code?: string | null
          id: string
          latency_ms: number
          payload_size_bytes?: number | null
          success: boolean
          tenant_id?: string | null
          timestamp?: string
          tokens_used?: number | null
          tool_name: string
        }
        Update: {
          agent_id?: string
          cost_usd?: number
          department?: string
          error_code?: string | null
          id?: string
          latency_ms?: number
          payload_size_bytes?: number | null
          success?: boolean
          tenant_id?: string | null
          timestamp?: string
          tokens_used?: number | null
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_execution_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      tool_metric_rollups: {
        Row: {
          avg_latency_ms: number
          error_counts: Json
          p95_latency_ms: number
          p99_latency_ms: number
          period_end: string
          period_start: string
          success_rate: number
          tool_name: string
          total_cost_usd: number
          total_executions: number
          total_tokens_used: number
        }
        Insert: {
          avg_latency_ms: number
          error_counts?: Json
          p95_latency_ms: number
          p99_latency_ms: number
          period_end: string
          period_start: string
          success_rate: number
          tool_name: string
          total_cost_usd: number
          total_executions: number
          total_tokens_used: number
        }
        Update: {
          avg_latency_ms?: number
          error_counts?: Json
          p95_latency_ms?: number
          p99_latency_ms?: number
          period_end?: string
          period_start?: string
          success_rate?: number
          tool_name?: string
          total_cost_usd?: number
          total_executions?: number
          total_tokens_used?: number
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
      tool_policies: {
        Row: {
          action: string
          action_config: Json | null
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logic: string
          name: string
          priority: number
          scope: string
          target_agent_id: string | null
          target_department: string | null
          target_tool_name: string
          updated_at: string
        }
        Insert: {
          action: string
          action_config?: Json | null
          conditions?: Json
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          logic: string
          name: string
          priority?: number
          scope: string
          target_agent_id?: string | null
          target_department?: string | null
          target_tool_name: string
          updated_at?: string
        }
        Update: {
          action?: string
          action_config?: Json | null
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logic?: string
          name?: string
          priority?: number
          scope?: string
          target_agent_id?: string | null
          target_department?: string | null
          target_tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_policy_logs: {
        Row: {
          action: string
          agent_id: string
          allowed: boolean
          department: string
          evaluated_at: string
          id: string
          latency_ms: number
          policy_id: string | null
          reason: string | null
          tool_name: string
        }
        Insert: {
          action: string
          agent_id: string
          allowed: boolean
          department: string
          evaluated_at?: string
          id?: string
          latency_ms: number
          policy_id?: string | null
          reason?: string | null
          tool_name: string
        }
        Update: {
          action?: string
          agent_id?: string
          allowed?: boolean
          department?: string
          evaluated_at?: string
          id?: string
          latency_ms?: number
          policy_id?: string | null
          reason?: string | null
          tool_name?: string
        }
        Relationships: []
      }
      tool_pricing_models: {
        Row: {
          base_cost_usd: number
          cost_per_cpu_second_usd: number
          cost_per_input_token_usd: number
          cost_per_memory_mb_second_usd: number
          cost_per_output_token_usd: number
          external_api_cost_multiplier: number
          model_type: string
          tool_name: string
          updated_at: string
        }
        Insert: {
          base_cost_usd?: number
          cost_per_cpu_second_usd?: number
          cost_per_input_token_usd?: number
          cost_per_memory_mb_second_usd?: number
          cost_per_output_token_usd?: number
          external_api_cost_multiplier?: number
          model_type: string
          tool_name: string
          updated_at?: string
        }
        Update: {
          base_cost_usd?: number
          cost_per_cpu_second_usd?: number
          cost_per_input_token_usd?: number
          cost_per_memory_mb_second_usd?: number
          cost_per_output_token_usd?: number
          external_api_cost_multiplier?: number
          model_type?: string
          tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_security_scans: {
        Row: {
          id: string
          passed: boolean
          risk_level: string
          scanned_at: string
          tool_name: string
          version: string
          warnings: string[]
        }
        Insert: {
          id?: string
          passed: boolean
          risk_level: string
          scanned_at?: string
          tool_name: string
          version: string
          warnings?: string[]
        }
        Update: {
          id?: string
          passed?: boolean
          risk_level?: string
          scanned_at?: string
          tool_name?: string
          version?: string
          warnings?: string[]
        }
        Relationships: []
      }
      tool_versions: {
        Row: {
          archived_at: string | null
          changelog: string | null
          deprecated_at: string | null
          id: string
          major: number
          manifest: Json
          minor: number
          patch: number
          published_at: string
          status: string
          tool_name: string
          version: string
        }
        Insert: {
          archived_at?: string | null
          changelog?: string | null
          deprecated_at?: string | null
          id: string
          major: number
          manifest: Json
          minor: number
          patch: number
          published_at?: string
          status: string
          tool_name: string
          version: string
        }
        Update: {
          archived_at?: string | null
          changelog?: string | null
          deprecated_at?: string | null
          id?: string
          major?: number
          manifest?: Json
          minor?: number
          patch?: number
          published_at?: string
          status?: string
          tool_name?: string
          version?: string
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
      usage_meters: {
        Row: {
          id: string
          metric_name: string
          period_end: string
          period_start: string
          recorded_at: string
          tenant_id: string
          value: number
        }
        Insert: {
          id?: string
          metric_name: string
          period_end: string
          period_start: string
          recorded_at?: string
          tenant_id: string
          value: number
        }
        Update: {
          id?: string
          metric_name?: string
          period_end?: string
          period_start?: string
          recorded_at?: string
          tenant_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_meters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memories: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id: string
          metadata?: Json
          tenant_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active_hours_end: number
          active_hours_start: number
          category: string
          communication_style: string
          created_at: string
          email: string
          id: string
          name: string | null
          permissions: string[]
          preferences: Json
          preferred_language: string
          role: string
          timezone: string
          updated_at: string
        }
        Insert: {
          active_hours_end?: number
          active_hours_start?: number
          category?: string
          communication_style?: string
          created_at?: string
          email: string
          id: string
          name?: string | null
          permissions?: string[]
          preferences?: Json
          preferred_language?: string
          role?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          active_hours_end?: number
          active_hours_start?: number
          category?: string
          communication_style?: string
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          permissions?: string[]
          preferences?: Json
          preferred_language?: string
          role?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_audit_logs: {
        Row: {
          action: string
          details: Json
          id: string
          ip_address: string | null
          secret_id: string | null
          success: boolean
          tenant_id: string
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json
          id: string
          ip_address?: string | null
          secret_id?: string | null
          success?: boolean
          tenant_id: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json
          id?: string
          ip_address?: string | null
          secret_id?: string | null
          success?: boolean
          tenant_id?: string
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vault_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_health_checks: {
        Row: {
          active_tasks: number
          cpu_usage: number
          disk_usage: number
          errors: string[] | null
          id: string
          memory_usage: number
          network_latency_ms: number
          timestamp: string
          worker_id: string
        }
        Insert: {
          active_tasks?: number
          cpu_usage: number
          disk_usage: number
          errors?: string[] | null
          id: string
          memory_usage: number
          network_latency_ms?: number
          timestamp?: string
          worker_id: string
        }
        Update: {
          active_tasks?: number
          cpu_usage?: number
          disk_usage?: number
          errors?: string[] | null
          id?: string
          memory_usage?: number
          network_latency_ms?: number
          timestamp?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_health_checks_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_nodes: {
        Row: {
          capabilities: string[]
          cpu_cores: number
          cpu_usage: number
          created_at: string
          current_task_count: number
          disk_gb: number
          hostname: string
          id: string
          ip_address: string
          last_heartbeat_at: string
          load_average: number
          max_concurrent_tasks: number
          memory_gb: number
          memory_usage: number
          metadata: Json | null
          region: string
          started_at: string
          status: string
          updated_at: string
          version: string
          zone: string
        }
        Insert: {
          capabilities?: string[]
          cpu_cores?: number
          cpu_usage?: number
          created_at?: string
          current_task_count?: number
          disk_gb?: number
          hostname: string
          id: string
          ip_address: string
          last_heartbeat_at?: string
          load_average?: number
          max_concurrent_tasks?: number
          memory_gb?: number
          memory_usage?: number
          metadata?: Json | null
          region: string
          started_at?: string
          status: string
          updated_at?: string
          version?: string
          zone: string
        }
        Update: {
          capabilities?: string[]
          cpu_cores?: number
          cpu_usage?: number
          created_at?: string
          current_task_count?: number
          disk_gb?: number
          hostname?: string
          id?: string
          ip_address?: string
          last_heartbeat_at?: string
          load_average?: number
          max_concurrent_tasks?: number
          memory_gb?: number
          memory_usage?: number
          metadata?: Json | null
          region?: string
          started_at?: string
          status?: string
          updated_at?: string
          version?: string
          zone?: string
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
      workspace_budget_usage: {
        Row: {
          amount_usd: number
          description: string | null
          id: string
          recorded_at: string
          workspace_id: string
        }
        Insert: {
          amount_usd: number
          description?: string | null
          id: string
          recorded_at?: string
          workspace_id: string
        }
        Update: {
          amount_usd?: number
          description?: string | null
          id?: string
          recorded_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_budget_usage_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_memberships: {
        Row: {
          id: string
          joined_at: string
          last_active_at: string | null
          permissions: string[] | null
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          id: string
          joined_at?: string
          last_active_at?: string | null
          permissions?: string[] | null
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_active_at?: string | null
          permissions?: string[] | null
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_memberships_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          isolation_level: string
          isolation_policy: Json
          max_members: number
          member_ids: Json
          metadata: Json | null
          name: string
          owner_id: string
          resource_quota: Json
          slug: string
          status: string
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id: string
          isolation_level: string
          isolation_policy?: Json
          max_members?: number
          member_ids?: Json
          metadata?: Json | null
          name: string
          owner_id: string
          resource_quota?: Json
          slug: string
          status?: string
          tags?: string[] | null
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          isolation_level?: string
          isolation_policy?: Json
          max_members?: number
          member_ids?: Json
          metadata?: Json | null
          name?: string
          owner_id?: string
          resource_quota?: Json
          slug?: string
          status?: string
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      boost_department_memory_access: {
        Args: { memory_ids: string[] }
        Returns: undefined
      }
      boost_memory_importance: {
        Args: { memory_ids: string[] }
        Returns: undefined
      }
      calculate_memory_health_stats: {
        Args: never
        Returns: {
          avg_relevance: number
          last_retrieved: string
          memory_id: string
          source: string
          total_retrievals: number
        }[]
      }
      clearance_rank: { Args: { _level: string }; Returns: number }
      decay_stale_memories: {
        Args: { days_threshold: number; decay_factor: number }
        Returns: undefined
      }
      get_user_clearance: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_team_child_count: {
        Args: { _team_id: string }
        Returns: undefined
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_project_member: {
        Args: { _project_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
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
      match_department_memories_v2: {
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
          kpi_impact: Json
          similarity: number
          synthesis_state: string
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
      match_project_memories: {
        Args: {
          filter_types: string[]
          match_count: number
          match_threshold: number
          query_embedding: string
          query_project_id: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          project_id: string
          similarity: number
          type: string
        }[]
      }
      match_shared_memories: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          requester_clearance: string
        }
        Returns: {
          access_level: string
          category: string
          content: string
          id: string
          origin: string
          similarity: number
          source_department: string
        }[]
      }
      match_user_memories: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
          query_user_id: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          type: string
          user_id: string
        }[]
      }
      tenant_role: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: string
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
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
