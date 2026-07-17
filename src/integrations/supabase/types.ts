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
