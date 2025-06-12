export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      deleted_users: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          deleted_at: string;
          deleted_by: string | null;
          original_data: Json | null;
          last_sign_in_at: string | null;
          user_type: 'admin' | 'wholesale' | 'retail' | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          deleted_at?: string;
          deleted_by?: string | null;
          original_data?: Json | null;
          last_sign_in_at?: string | null;
          user_type?: 'admin' | 'wholesale' | 'retail' | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          deleted_at?: string;
          deleted_by?: string | null;
          original_data?: Json | null;
          last_sign_in_at?: string | null;
          user_type?: 'admin' | 'wholesale' | 'retail' | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          title_en: string;
          title_ar: string;
          title_he: string;
          description_en: string;
          description_ar: string;
          description_he: string;
          discount_percent: number;
          image_url: string;
          start_date: string;
          end_date: string;
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at'>> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['offers']['Row']>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          name_he: string;
          description_en: string;
          description_ar: string;
          description_he: string;
          price: number;
          wholesale_price: number | null;
          original_price: number | null;
          image: string;
          images: string[] | null;
          category_id: string;
          in_stock: boolean | null;
          active: boolean | null;
          created_at: string;
          updated_at: string;
          rating: number | null;
          reviews_count: number | null;
          discount: number | null;
          featured: boolean | null;
          tags: string[] | null;
          stock_quantity: number | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          user_type: 'admin' | 'wholesale' | 'retail';
          created_at: string;
          updated_at: string;
          disabled: boolean | null;
          email_confirmed_at?: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      contact_info: {
        Row: {
          id: string;
          email: string;
          phone: string;
          address: string;
          working_hours: string;
          fields_order: Json;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['contact_info']['Row'], 'id' | 'updated_at'>> & { id?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['contact_info']['Row']>;
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          city: string;
          area: string;
          street: string;
          building: string;
          floor?: string;
          apartment?: string;
          is_default?: boolean;
        };
        Insert: Partial<Omit<Database['public']['Tables']['addresses']['Row'], 'id'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['addresses']['Row']>;
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title_en: string;
          title_ar: string;
          title_he: string;
          subtitle_en: string;
          subtitle_ar: string;
          subtitle_he: string;
          image: string;
          link?: string;
          active: boolean;
          sort_order?: number;
        };
        Insert: Partial<Omit<Database['public']['Tables']['banners']['Row'], 'id'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['banners']['Row']>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_ar: string;
          name_he: string;
          image: string;
          icon: string;
          active: boolean;
          created_at?: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['categories']['Row'], 'id'>> & { id?: string };
        Update: Partial<Database['public']['Tables']['categories']['Row']>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          customer_name?: string | null; // اسم العميل إذا لم يوجد user_id
          total: number;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          payment_method: string;
          shipping_address: string;
          notes?: string;
          created_at: string;
          updated_at: string;
          items?: string; // JSON string of items (legacy)
          profiles?: Database['public']['Tables']['profiles']['Row'];
          order_items?: Array<{
            id: string;
            order_id: string;
            product_id: string;
            quantity: number;
            price: number;
            products?: Database['public']['Tables']['products']['Row'];
          }>;
          admin_created?: boolean;
          admin_creator_name?: string;
          cancelled_by?: string;
          cancelled_by_name?: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
        Relationships: [];
      };
    };
  };
};
// Helpers for type-safe table access
export type Tables<TableName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TableName]['Row'];
export type TablesInsert<TableName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TableName]['Insert'];
export type TablesUpdate<TableName extends keyof Database['public']['Tables']> = Database['public']['Tables'][TableName]['Update'];