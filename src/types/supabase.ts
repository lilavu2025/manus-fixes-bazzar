export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          apartment: string | null
          area: string
          building: string
          city: string
          created_at: string
          floor: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string
          street: string
          user_id: string
        }
        Insert: {
          apartment?: string | null
          area: string
          building: string
          city: string
          created_at?: string
          floor?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone: string
          street: string
          user_id: string
        }
        Update: {
          apartment?: string | null
          area?: string
          building?: string
          city?: string
          created_at?: string
          floor?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string
          street?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          image: string
          link: string | null
          sort_order: number | null
          subtitle_ar: string
          subtitle_en: string
          subtitle_he: string
          title_ar: string
          title_en: string
          title_he: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          image: string
          link?: string | null
          sort_order?: number | null
          subtitle_ar: string
          subtitle_en: string
          subtitle_he: string
          title_ar: string
          title_en: string
          title_he: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          image?: string
          link?: string | null
          sort_order?: number | null
          subtitle_ar?: string
          subtitle_en?: string
          subtitle_he?: string
          title_ar?: string
          title_en?: string
          title_he?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          added_at: string | null
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean | null
          created_at: string
          icon: string
          id: string
          image: string
          name_ar: string
          name_en: string
          name_he: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          icon: string
          id?: string
          image: string
          name_ar: string
          name_en: string
          name_he: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          icon?: string
          id?: string
          image?: string
          name_ar?: string
          name_en?: string
          name_he?: string
        }
        Relationships: []
      }
      contact_info: {
        Row: {
          address: string | null
          email: string
          facebook: string | null
          fields_order: Json | null
          id: string
          instagram: string | null
          phone: string | null
          updated_at: string | null
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          email: string
          facebook?: string | null
          fields_order?: Json | null
          id?: string
          instagram?: string | null
          phone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          email?: string
          facebook?: string | null
          fields_order?: Json | null
          id?: string
          instagram?: string | null
          phone?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      deleted_users: {
        Row: {
          address: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          deleted_by_name: string | null
          email: string | null
          full_name: string | null
          highest_order_value: number | null
          id: string
          last_sign_in_at: string | null
          orders: Json | null
          original_data: Json | null
          phone: string | null
          purchased_products: Json | null
          user_id: string
          user_type: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          full_name?: string | null
          highest_order_value?: number | null
          id?: string
          last_sign_in_at?: string | null
          orders?: Json | null
          original_data?: Json | null
          phone?: string | null
          purchased_products?: Json | null
          user_id: string
          user_type?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          deleted_by_name?: string | null
          email?: string | null
          full_name?: string | null
          highest_order_value?: number | null
          id?: string
          last_sign_in_at?: string | null
          orders?: Json | null
          original_data?: Json | null
          phone?: string | null
          purchased_products?: Json | null
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          added_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          active: boolean | null
          created_at: string | null
          description_ar: string
          description_en: string
          description_he: string
          discount_percent: number
          end_date: string
          id: string
          image_url: string
          start_date: string
          title_ar: string
          title_en: string
          title_he: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description_ar: string
          description_en: string
          description_he: string
          discount_percent: number
          end_date: string
          id?: string
          image_url: string
          start_date: string
          title_ar: string
          title_en: string
          title_he: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description_ar?: string
          description_en?: string
          description_he?: string
          discount_percent?: number
          end_date?: string
          id?: string
          image_url?: string
          start_date?: string
          title_ar?: string
          title_en?: string
          title_he?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          order_number: number | null
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          order_number?: number | null
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          order_number?: number | null
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_created: boolean | null
          admin_creator_name: string | null
          cancelled_by: string | null
          cancelled_by_name: string | null
          created_at: string
          customer_name: string | null
          discount_type: string | null
          discount_value: number | null
          id: string
          items: Json | null
          notes: string | null
          order_number: number
          payment_method: string
          shipping_address: Json
          status: string
          total: number
          total_after_discount: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_created?: boolean | null
          admin_creator_name?: string | null
          cancelled_by?: string | null
          cancelled_by_name?: string | null
          created_at?: string
          customer_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: number
          payment_method?: string
          shipping_address: Json
          status?: string
          total: number
          total_after_discount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_created?: boolean | null
          admin_creator_name?: string | null
          cancelled_by?: string | null
          cancelled_by_name?: string | null
          created_at?: string
          customer_name?: string | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          items?: Json | null
          notes?: string | null
          order_number?: number
          payment_method?: string
          shipping_address?: Json
          status?: string
          total?: number
          total_after_discount?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category_id: string
          created_at: string
          description_ar: string
          description_en: string
          description_he: string
          discount: number | null
          featured: boolean | null
          id: string
          image: string
          images: string[] | null
          in_stock: boolean | null
          name_ar: string
          name_en: string
          name_he: string
          original_price: number | null
          price: number
          rating: number | null
          reviews_count: number | null
          sales_count: number | null
          stock_quantity: number | null
          tags: string[] | null
          top_ordered: boolean | null
          updated_at: string
          wholesale_price: number | null
        }
        Insert: {
          active?: boolean | null
          category_id: string
          created_at?: string
          description_ar: string
          description_en: string
          description_he: string
          discount?: number | null
          featured?: boolean | null
          id?: string
          image: string
          images?: string[] | null
          in_stock?: boolean | null
          name_ar: string
          name_en: string
          name_he: string
          original_price?: number | null
          price: number
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          top_ordered?: boolean | null
          updated_at?: string
          wholesale_price?: number | null
        }
        Update: {
          active?: boolean | null
          category_id?: string
          created_at?: string
          description_ar?: string
          description_en?: string
          description_he?: string
          discount?: number | null
          featured?: boolean | null
          id?: string
          image?: string
          images?: string[] | null
          in_stock?: boolean | null
          name_ar?: string
          name_en?: string
          name_he?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          stock_quantity?: number | null
          tags?: string[] | null
          top_ordered?: boolean | null
          updated_at?: string
          wholesale_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          disabled: boolean | null
          email: string | null
          email_confirmed_at: string | null
          full_name: string
          highest_order_value: number | null
          id: string
          language: string | null
          last_order_date: string | null
          last_sign_in_at: string | null
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          created_at?: string
          disabled?: boolean | null
          email?: string | null
          email_confirmed_at?: string | null
          full_name: string
          highest_order_value?: number | null
          id: string
          language?: string | null
          last_order_date?: string | null
          last_sign_in_at?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          created_at?: string
          disabled?: boolean | null
          email?: string | null
          email_confirmed_at?: string | null
          full_name?: string
          highest_order_value?: number | null
          id?: string
          language?: string | null
          last_order_date?: string | null
          last_sign_in_at?: string | null
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          new_value: string | null
          old_value: string | null
          target_field: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_field?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_field?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_notification_settings: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          push_enabled: boolean
          order_updates: boolean
          promotions: boolean
          new_products: boolean
          price_drops: boolean
          device_token: string
          device_type: string
          last_updated: string
        }[]
      }
      log_multiple_user_updates: {
        Args: { p_admin_id: string; p_user_id: string; p_changes: Json }
        Returns: string[]
      }
      log_user_update_activity: {
        Args: {
          p_admin_id: string
          p_user_id: string
          p_field_name: string
          p_old_value: string
          p_new_value: string
          p_details?: Json
        }
        Returns: string
      }
      send_global_notification: {
        Args: {
          p_title_ar: string
          p_message_ar: string
          p_title_en?: string
          p_message_en?: string
          p_title_he?: string
          p_message_he?: string
          p_type?: string
          p_action_url?: string
          p_image_url?: string
          p_data?: Json
        }
        Returns: string
      }
      send_notification_to_all_users: {
        Args: { notification_uuid: string }
        Returns: undefined
      }
      send_notification_to_users: {
        Args: { notification_uuid: string; user_ids: string[] }
        Returns: undefined
      }
      send_user_notification: {
        Args: {
          p_user_id: string
          p_title_ar: string
          p_message_ar: string
          p_title_en?: string
          p_message_en?: string
          p_title_he?: string
          p_message_he?: string
          p_type?: string
          p_action_url?: string
          p_image_url?: string
          p_data?: Json
        }
        Returns: string
      }
      upsert_notification_settings: {
        Args: {
          p_user_id: string
          p_push_enabled: boolean
          p_order_updates: boolean
          p_promotions: boolean
          p_new_products: boolean
          p_price_drops: boolean
          p_device_token?: string
          p_device_type?: string
        }
        Returns: undefined
      }
      upsert_user_device: {
        Args: {
          p_user_id: string
          p_device_token: string
          p_device_type: string
        }
        Returns: undefined
      }
      validate_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
    }
    Enums: {
      notification_type:
        | "order_status_change"
        | "order_created"
        | "order_cancelled"
        | "order_delivered"
        | "product_added"
        | "product_updated"
        | "offer_created"
        | "offer_ending_soon"
        | "custom_message"
        | "welcome_message"
        | "cart_reminder"
        | "payment_reminder"
        | "low_stock_alert"
        | "back_in_stock"
      user_type: "admin" | "wholesale" | "retail"
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
      notification_type: [
        "order_status_change",
        "order_created",
        "order_cancelled",
        "order_delivered",
        "product_added",
        "product_updated",
        "offer_created",
        "offer_ending_soon",
        "custom_message",
        "welcome_message",
        "cart_reminder",
        "payment_reminder",
        "low_stock_alert",
        "back_in_stock",
      ],
      user_type: ["admin", "wholesale", "retail"],
    },
  },
} as const
