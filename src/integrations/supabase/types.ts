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
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          scopes: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          scopes?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          scopes?: string[]
        }
        Relationships: []
      }
      appointment_payments: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          pix_payload: string | null
          provider: string
          receipt_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_payload?: string | null
          provider?: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_payload?: string | null
          provider?: string
          receipt_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          email: string | null
          external_id: string | null
          external_source: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          professional: string | null
          status: string
          treatment: string
          whatsapp_response: Json | null
          whatsapp_sent: boolean
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          professional?: string | null
          status?: string
          treatment: string
          whatsapp_response?: Json | null
          whatsapp_sent?: boolean
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          email?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          professional?: string | null
          status?: string
          treatment?: string
          whatsapp_response?: Json | null
          whatsapp_sent?: boolean
        }
        Relationships: []
      }
      chatpro_config: {
        Row: {
          endpoint: string
          id: string
          instance_code: string
          is_active: boolean
          message_template: string
          token: string
          updated_at: string
        }
        Insert: {
          endpoint: string
          id?: string
          instance_code: string
          is_active?: boolean
          message_template?: string
          token: string
          updated_at?: string
        }
        Update: {
          endpoint?: string
          id?: string
          instance_code?: string
          is_active?: boolean
          message_template?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      clinic_holidays: {
        Row: {
          created_at: string
          holiday_date: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          holiday_date: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          holiday_date?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      clinic_hours: {
        Row: {
          close_time: string | null
          is_open: boolean
          open_time: string | null
          updated_at: string
          weekday: number
        }
        Insert: {
          close_time?: string | null
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
          weekday: number
        }
        Update: {
          close_time?: string | null
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      clinic_settings: {
        Row: {
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          is_public?: boolean
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      clinicorp_busy_slots: {
        Row: {
          busy_date: string
          end_time: string
          external_id: string
          id: string
          patient_name: string | null
          professional_external_id: string | null
          professional_slug: string | null
          raw: Json | null
          start_time: string
          status: string
          synced_at: string
          treatment: string | null
        }
        Insert: {
          busy_date: string
          end_time: string
          external_id: string
          id?: string
          patient_name?: string | null
          professional_external_id?: string | null
          professional_slug?: string | null
          raw?: Json | null
          start_time: string
          status?: string
          synced_at?: string
          treatment?: string | null
        }
        Update: {
          busy_date?: string
          end_time?: string
          external_id?: string
          id?: string
          patient_name?: string | null
          professional_external_id?: string | null
          professional_slug?: string | null
          raw?: Json | null
          start_time?: string
          status?: string
          synced_at?: string
          treatment?: string | null
        }
        Relationships: []
      }
      clinicorp_sync_log: {
        Row: {
          created_at: string
          duration_ms: number | null
          id: string
          message: string | null
          slots_synced: number | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          slots_synced?: number | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          id?: string
          message?: string | null
          slots_synced?: number | null
          status?: string
        }
        Relationships: []
      }
      commission_entries: {
        Row: {
          amount_cents: number
          base_amount_cents: number
          created_at: string
          financial_entry_id: string | null
          id: string
          paid_at: string | null
          professional_name: string | null
          professional_slug: string
          reference_month: string | null
          rule_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          base_amount_cents?: number
          created_at?: string
          financial_entry_id?: string | null
          id?: string
          paid_at?: string | null
          professional_name?: string | null
          professional_slug: string
          reference_month?: string | null
          rule_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          base_amount_cents?: number
          created_at?: string
          financial_entry_id?: string | null
          id?: string
          paid_at?: string | null
          professional_name?: string | null
          professional_slug?: string
          reference_month?: string | null
          rule_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      commission_rules: {
        Row: {
          active: boolean
          created_at: string
          fixed_cents: number | null
          id: string
          percent: number | null
          professional_slug: string
          treatment_slug: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          fixed_cents?: number | null
          id?: string
          percent?: number | null
          professional_slug: string
          treatment_slug?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          fixed_cents?: number | null
          id?: string
          percent?: number | null
          professional_slug?: string
          treatment_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      external_integrations: {
        Row: {
          config: Json
          last_error: string | null
          last_sync_at: string | null
          provider: string
          secrets_set: boolean
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          secrets_set?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          secrets_set?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_entries: {
        Row: {
          amount_cents: number
          appointment_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          method: string | null
          paid_at: string | null
          patient_name: string | null
          status: string
          type: string
        }
        Insert: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_name?: string | null
          status?: string
          type: string
        }
        Update: {
          amount_cents?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_name?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      landing_pages: {
        Row: {
          active: boolean
          content: Json
          created_at: string
          id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content?: Json
          created_at?: string
          id?: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: Json
          created_at?: string
          id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          estimated_value_cents: number | null
          id: string
          last_touch_at: string | null
          name: string
          next_followup_at: string | null
          notes: string | null
          owner: string | null
          phone: string | null
          source: string | null
          status: string
          treatment_interest: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          estimated_value_cents?: number | null
          id?: string
          last_touch_at?: string | null
          name: string
          next_followup_at?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          treatment_interest?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          estimated_value_cents?: number | null
          id?: string
          last_touch_at?: string | null
          name?: string
          next_followup_at?: string | null
          notes?: string | null
          owner?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          treatment_interest?: string | null
        }
        Relationships: []
      }
      patient_accounts: {
        Row: {
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      patient_invoices: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          patient_phone: string
          payment_url: string | null
          status: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_phone: string
          payment_url?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          patient_phone?: string
          payment_url?: string | null
          status?: string
        }
        Relationships: []
      }
      patient_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          patient_phone: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note: string
          patient_phone: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          patient_phone?: string
        }
        Relationships: []
      }
      patient_odontogram: {
        Row: {
          created_at: string
          id: string
          patient_phone: string
          teeth: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          patient_phone: string
          teeth?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          patient_phone?: string
          teeth?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      patient_quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string | null
          discount_cents: number
          expires_at: string | null
          id: string
          items: Json
          notes: string | null
          patient_name: string
          patient_phone: string
          status: string
          subtotal_cents: number
          token: string
          total_cents: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_cents?: number
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          patient_name: string
          patient_phone: string
          status?: string
          subtotal_cents?: number
          token?: string
          total_cents?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string | null
          discount_cents?: number
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string | null
          patient_name?: string
          patient_phone?: string
          status?: string
          subtotal_cents?: number
          token?: string
          total_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      professional_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          end_time: string
          id: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_schedules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          color: string | null
          created_at: string
          cro: string | null
          email: string | null
          id: string
          name: string
          notes_internal: string | null
          phone: string | null
          photo_url: string | null
          services: string[] | null
          slot_minutes: number | null
          slug: string
          specialty: string | null
          status: string
          updated_at: string
          weekly_hours: number | null
        }
        Insert: {
          bio?: string | null
          color?: string | null
          created_at?: string
          cro?: string | null
          email?: string | null
          id?: string
          name: string
          notes_internal?: string | null
          phone?: string | null
          photo_url?: string | null
          services?: string[] | null
          slot_minutes?: number | null
          slug: string
          specialty?: string | null
          status?: string
          updated_at?: string
          weekly_hours?: number | null
        }
        Update: {
          bio?: string | null
          color?: string | null
          created_at?: string
          cro?: string | null
          email?: string | null
          id?: string
          name?: string
          notes_internal?: string | null
          phone?: string | null
          photo_url?: string | null
          services?: string[] | null
          slot_minutes?: number | null
          slug?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          weekly_hours?: number | null
        }
        Relationships: []
      }
      public_booking_links: {
        Row: {
          access_token: string | null
          active: boolean
          created_at: string
          description: string | null
          id: string
          professional_slug: string | null
          slug: string
          title: string
          treatment_slug: string | null
        }
        Insert: {
          access_token?: string | null
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          professional_slug?: string | null
          slug: string
          title: string
          treatment_slug?: string | null
        }
        Update: {
          access_token?: string | null
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          professional_slug?: string | null
          slug?: string
          title?: string
          treatment_slug?: string | null
        }
        Relationships: []
      }
      review_invites: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          patient_name: string
          patient_phone: string | null
          professional: string | null
          review_id: string | null
          token: string
          treatment: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          patient_name: string
          patient_phone?: string | null
          professional?: string | null
          review_id?: string | null
          token?: string
          treatment?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          patient_name?: string
          patient_phone?: string | null
          professional?: string | null
          review_id?: string | null
          token?: string
          treatment?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          patient_name: string
          rating: number
          replied_at: string | null
          reply: string | null
          source: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          patient_name: string
          rating: number
          replied_at?: string | null
          reply?: string | null
          source?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          patient_name?: string
          rating?: number
          replied_at?: string | null
          reply?: string | null
          source?: string
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          block_date: string
          created_at: string
          end_time: string | null
          id: string
          professional_slug: string | null
          reason: string | null
          start_time: string | null
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time?: string | null
          id?: string
          professional_slug?: string | null
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string | null
          id?: string
          professional_slug?: string | null
          reason?: string | null
          start_time?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      site_promotions: {
        Row: {
          active: boolean
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          ends_at: string | null
          id: string
          slug: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          slug?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          slug?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          active: boolean
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          active: boolean
          category: string | null
          cost_cents: number
          created_at: string
          current_qty: number
          id: string
          min_qty: number
          name: string
          sku: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          cost_cents?: number
          created_at?: string
          current_qty?: number
          id?: string
          min_qty?: number
          name: string
          sku?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          cost_cents?: number
          created_at?: string
          current_qty?: number
          id?: string
          min_qty?: number
          name?: string
          sku?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          appointment_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          qty: number
          reason: string | null
          type: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          qty: number
          reason?: string | null
          type: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          qty?: number
          reason?: string | null
          type?: string
        }
        Relationships: []
      }
      treatments_overrides: {
        Row: {
          active: boolean
          availability: string[] | null
          category: string | null
          description: string | null
          duration: string | null
          name: string | null
          prepayment_amount_cents: number | null
          price_from: string | null
          professional_slug: string | null
          requires_prepayment: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          availability?: string[] | null
          category?: string | null
          description?: string | null
          duration?: string | null
          name?: string | null
          prepayment_amount_cents?: number | null
          price_from?: string | null
          professional_slug?: string | null
          requires_prepayment?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          availability?: string[] | null
          category?: string | null
          description?: string | null
          duration?: string | null
          name?: string | null
          prepayment_amount_cents?: number | null
          price_from?: string | null
          professional_slug?: string | null
          requires_prepayment?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          user_id?: string
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
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          secret: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          secret: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          secret?: string
          url?: string
        }
        Relationships: []
      }
      whatsapp_bot_config: {
        Row: {
          business_hours_only: boolean
          created_at: string
          enabled: boolean
          fallback_message: string
          human_like_delay: boolean
          id: string
          model: string
          persona: string
          system_prompt: string
          updated_at: string
        }
        Insert: {
          business_hours_only?: boolean
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          human_like_delay?: boolean
          id?: string
          model?: string
          persona?: string
          system_prompt?: string
          updated_at?: string
        }
        Update: {
          business_hours_only?: boolean
          created_at?: string
          enabled?: boolean
          fallback_message?: string
          human_like_delay?: boolean
          id?: string
          model?: string
          persona?: string
          system_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_bot_intents: {
        Row: {
          action: string
          created_at: string
          enabled: boolean
          id: string
          key: string
          label: string
          position: number
          response_template: string
          trigger_examples: string[]
          updated_at: string
        }
        Insert: {
          action?: string
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          label: string
          position?: number
          response_template?: string
          trigger_examples?: string[]
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          label?: string
          position?: number
          response_template?: string
          trigger_examples?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_campaigns: {
        Row: {
          active: boolean
          audience_filter: Json
          created_at: string
          id: string
          last_run_at: string | null
          name: string
          schedule_cron: string | null
          stats: Json
          template: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience_filter?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          name: string
          schedule_cron?: string | null
          stats?: Json
          template: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience_filter?: Json
          created_at?: string
          id?: string
          last_run_at?: string | null
          name?: string
          schedule_cron?: string | null
          stats?: Json
          template?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          ai_enabled: boolean
          contact_name: string | null
          created_at: string
          id: string
          last_message_at: string
          phone: string
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          phone: string
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          phone?: string
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_event_settings: {
        Row: {
          delay_minutes: number
          enabled: boolean
          event_key: string
          template: string
          updated_at: string
        }
        Insert: {
          delay_minutes?: number
          enabled?: boolean
          event_key: string
          template?: string
          updated_at?: string
        }
        Update: {
          delay_minutes?: number
          enabled?: boolean
          event_key?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          ai_used: boolean
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          intent_matched: string | null
        }
        Insert: {
          ai_used?: boolean
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          intent_matched?: string | null
        }
        Update: {
          ai_used?: boolean
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          intent_matched?: string | null
        }
        Relationships: []
      }
      whatsapp_messages_log: {
        Row: {
          appointment_id: string | null
          campaign_id: string | null
          id: string
          message: string | null
          provider_id: string | null
          provider_type: string
          response: Json | null
          sent_at: string
          status: string
          template_key: string | null
          to_number: string
        }
        Insert: {
          appointment_id?: string | null
          campaign_id?: string | null
          id?: string
          message?: string | null
          provider_id?: string | null
          provider_type: string
          response?: Json | null
          sent_at?: string
          status?: string
          template_key?: string | null
          to_number: string
        }
        Update: {
          appointment_id?: string | null
          campaign_id?: string | null
          id?: string
          message?: string | null
          provider_id?: string | null
          provider_type?: string
          response?: Json | null
          sent_at?: string
          status?: string
          template_key?: string | null
          to_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_log_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_log_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_providers: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          label: string
          last_seen_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          last_seen_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          last_seen_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote_with_token: { Args: { _token: string }; Returns: string }
      has_permission: {
        Args: { _action?: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_review_with_token: {
        Args: { _comment: string; _rating: number; _token: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin"
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
      app_role: ["admin"],
    },
  },
} as const
