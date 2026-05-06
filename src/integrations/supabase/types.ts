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
      activities: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          product_id: string | null
          target: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          product_id?: string | null
          target?: string | null
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          product_id?: string | null
          target?: string | null
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          role: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          role: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string | null
          product_id: string | null
          read: boolean | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          product_id?: string | null
          read?: boolean | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          product_id?: string | null
          read?: boolean | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      calculations: {
        Row: {
          created_at: string
          id: string
          inputs: Json
          product_id: string | null
          results: Json
          sku: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inputs: Json
          product_id?: string | null
          results: Json
          sku?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inputs?: Json
          product_id?: string | null
          results?: Json
          sku?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calculations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      competitors: {
        Row: {
          analysis_id: string
          condition: string | null
          created_at: string
          free_shipping: boolean | null
          id: string
          image_url: string | null
          listing_type: string | null
          ml_item_id: string | null
          permalink: string | null
          price: number | null
          seller_nickname: string | null
          seller_reputation: string | null
          sold_quantity: number | null
          title: string
        }
        Insert: {
          analysis_id: string
          condition?: string | null
          created_at?: string
          free_shipping?: boolean | null
          id?: string
          image_url?: string | null
          listing_type?: string | null
          ml_item_id?: string | null
          permalink?: string | null
          price?: number | null
          seller_nickname?: string | null
          seller_reputation?: string | null
          sold_quantity?: number | null
          title: string
        }
        Update: {
          analysis_id?: string
          condition?: string | null
          created_at?: string
          free_shipping?: boolean | null
          id?: string
          image_url?: string | null
          listing_type?: string | null
          ml_item_id?: string | null
          permalink?: string | null
          price?: number | null
          seller_nickname?: string | null
          seller_reputation?: string | null
          sold_quantity?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitors_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "market_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      market_analyses: {
        Row: {
          avg_price: number | null
          created_at: string
          free_shipping_pct: number | null
          id: string
          max_price: number | null
          median_price: number | null
          min_price: number | null
          query: string
          total_results: number | null
          user_id: string
        }
        Insert: {
          avg_price?: number | null
          created_at?: string
          free_shipping_pct?: number | null
          id?: string
          max_price?: number | null
          median_price?: number | null
          min_price?: number | null
          query: string
          total_results?: number | null
          user_id: string
        }
        Update: {
          avg_price?: number | null
          created_at?: string
          free_shipping_pct?: number | null
          id?: string
          max_price?: number | null
          median_price?: number | null
          min_price?: number | null
          query?: string
          total_results?: number | null
          user_id?: string
        }
        Relationships: []
      }
      ml_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          ml_nickname: string | null
          ml_user_id: string | null
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          ml_nickname?: string | null
          ml_user_id?: string | null
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          ml_nickname?: string | null
          ml_user_id?: string | null
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          created_at: string
          id: string
          margin: number | null
          price: number
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          margin?: number | null
          price: number
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          margin?: number | null
          price?: number
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ads_cost: number | null
          cost: number | null
          created_at: string
          current_price: number | null
          desired_margin: number | null
          id: string
          image_url: string | null
          last_analyzed_at: string | null
          last_analyzed_by: string | null
          listing_type: string | null
          ml_item_id: string | null
          operational_cost: number | null
          packaging_cost: number | null
          recommended_price: number | null
          shipping_cost: number | null
          sku: string | null
          status: string | null
          tax_percent: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ads_cost?: number | null
          cost?: number | null
          created_at?: string
          current_price?: number | null
          desired_margin?: number | null
          id?: string
          image_url?: string | null
          last_analyzed_at?: string | null
          last_analyzed_by?: string | null
          listing_type?: string | null
          ml_item_id?: string | null
          operational_cost?: number | null
          packaging_cost?: number | null
          recommended_price?: number | null
          shipping_cost?: number | null
          sku?: string | null
          status?: string | null
          tax_percent?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ads_cost?: number | null
          cost?: number | null
          created_at?: string
          current_price?: number | null
          desired_margin?: number | null
          id?: string
          image_url?: string | null
          last_analyzed_at?: string | null
          last_analyzed_by?: string | null
          listing_type?: string | null
          ml_item_id?: string | null
          operational_cost?: number | null
          packaging_cost?: number | null
          recommended_price?: number | null
          shipping_cost?: number | null
          sku?: string | null
          status?: string | null
          tax_percent?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          cargo: string | null
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_message_attachments: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json | null
          updated_at?: string
          user_id?: string
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
      activity_type:
        | "price_search"
        | "market_analysis"
        | "price_calculation"
        | "product_created"
        | "product_updated"
        | "product_deleted"
        | "ml_connected"
        | "ml_disconnected"
        | "ai_chat"
      alert_severity: "info" | "warning" | "danger"
      app_role: "admin" | "member" | "operador"
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
      activity_type: [
        "price_search",
        "market_analysis",
        "price_calculation",
        "product_created",
        "product_updated",
        "product_deleted",
        "ml_connected",
        "ml_disconnected",
        "ai_chat",
      ],
      alert_severity: ["info", "warning", "danger"],
      app_role: ["admin", "member", "operador"],
    },
  },
} as const
