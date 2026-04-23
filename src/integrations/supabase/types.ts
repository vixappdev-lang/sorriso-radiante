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
      professional_schedules: {
        Row: {
          end_time: string
          id: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Update: {
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
          created_at: string
          cro: string | null
          email: string | null
          id: string
          name: string
          notes_internal: string | null
          phone: string | null
          photo_url: string | null
          slug: string
          specialty: string | null
          status: string
          updated_at: string
          weekly_hours: number | null
        }
        Insert: {
          created_at?: string
          cro?: string | null
          email?: string | null
          id?: string
          name: string
          notes_internal?: string | null
          phone?: string | null
          photo_url?: string | null
          slug: string
          specialty?: string | null
          status?: string
          updated_at?: string
          weekly_hours?: number | null
        }
        Update: {
          created_at?: string
          cro?: string | null
          email?: string | null
          id?: string
          name?: string
          notes_internal?: string | null
          phone?: string | null
          photo_url?: string | null
          slug?: string
          specialty?: string | null
          status?: string
          updated_at?: string
          weekly_hours?: number | null
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
      treatments_overrides: {
        Row: {
          active: boolean
          availability: string[] | null
          category: string | null
          description: string | null
          duration: string | null
          name: string | null
          price_from: string | null
          professional_slug: string | null
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
          price_from?: string | null
          professional_slug?: string | null
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
          price_from?: string | null
          professional_slug?: string | null
          slug?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
