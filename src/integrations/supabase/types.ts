export type Database = {
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
          fields_order: any | null
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
          fields_order?: any | null
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
          fields_order?: any | null
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
          orders: any | null
          original_data: any | null
          phone: string | null
          purchased_products: any | null
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
          orders?: any | null
          original_data?: any | null
          phone?: string | null
          purchased_products?: any | null
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
          orders?: any | null
          original_data?: any | null
          phone?: string | null
          purchased_products?: any | null
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
          items: any | null
          notes: string | null
          order_number: number
          payment_method: string
          shipping_address: any
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
          items?: any | null
          notes?: string | null
          order_number?: number
          payment_method?: string
          shipping_address: any
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
          items?: any | null
          notes?: string | null
          order_number?: number
          payment_method?: string
          shipping_address?: any
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
          admin_id: string
          created_at: string | null
          details: any | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: any | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: any | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validate_phone: {
        Args: { phone_number: string }
        Returns: boolean
      }
    }
    Enums: {
      user_type: "admin" | "wholesale" | "retail"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["admin", "wholesale", "retail"],
    },
  },
} as const
