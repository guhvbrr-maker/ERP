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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean | null
          code: string | null
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_rules: {
        Row: {
          category_id: string | null
          commission_type: string
          created_at: string | null
          id: string
          position_id: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          commission_type: string
          created_at?: string | null
          id?: string
          position_id: string
          rate?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          commission_type?: string
          created_at?: string | null
          id?: string
          position_id?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_rules_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birth_date: string | null
          created_at: string | null
          credit_limit: number | null
          customer_since: string | null
          id: string
          person_id: string
          preferred_contact: string | null
          updated_at: string | null
        }
        Insert: {
          birth_date?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_since?: string | null
          id?: string
          person_id: string
          preferred_contact?: string | null
          updated_at?: string | null
        }
        Update: {
          birth_date?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_since?: string | null
          id?: string
          person_id?: string
          preferred_contact?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_positions: {
        Row: {
          created_at: string | null
          employee_id: string
          ended_at: string | null
          id: string
          is_primary: boolean | null
          position_id: string
          started_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean | null
          position_id: string
          started_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean | null
          position_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_positions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          department: string | null
          hire_date: string | null
          id: string
          person_id: string
          position: string | null
          salary: number | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          department?: string | null
          hire_date?: string | null
          id?: string
          person_id: string
          position?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          department?: string | null
          hire_date?: string | null
          id?: string
          person_id?: string
          position?: string | null
          salary?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          active: boolean | null
          code: string | null
          color_code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          code?: string | null
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          active: boolean | null
          address: string | null
          address_complement: string | null
          address_number: string | null
          city: string | null
          contact_source: Database["public"]["Enums"]["contact_source"] | null
          created_at: string | null
          created_by: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          phone_secondary: string | null
          state: string | null
          type: Database["public"]["Enums"]["person_type"]
          updated_at: string | null
          zipcode: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          city?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          state?: string | null
          type: Database["public"]["Enums"]["person_type"]
          updated_at?: string | null
          zipcode?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          city?: string | null
          contact_source?: Database["public"]["Enums"]["contact_source"] | null
          created_at?: string | null
          created_by?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          phone_secondary?: string | null
          state?: string | null
          type?: Database["public"]["Enums"]["person_type"]
          updated_at?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
      positions: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          description: string | null
          has_assembly_commission: boolean | null
          has_delivery_commission: boolean | null
          has_revenue_commission: boolean | null
          has_sales_commission: boolean | null
          id: string
          name: string
          revenue_commission_rate: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          has_assembly_commission?: boolean | null
          has_delivery_commission?: boolean | null
          has_revenue_commission?: boolean | null
          has_sales_commission?: boolean | null
          id?: string
          name: string
          revenue_commission_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          has_assembly_commission?: boolean | null
          has_delivery_commission?: boolean | null
          has_revenue_commission?: boolean | null
          has_sales_commission?: boolean | null
          id?: string
          name?: string
          revenue_commission_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_attribute_types: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string | null
          id: string
          input_type: string | null
          name: string
          options: Json | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          id?: string
          input_type?: string | null
          name: string
          options?: Json | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string | null
          id?: string
          input_type?: string | null
          name?: string
          options?: Json | null
        }
        Relationships: []
      }
      product_attributes: {
        Row: {
          attribute_type_id: string
          created_at: string | null
          id: string
          product_id: string
          value: string
        }
        Insert: {
          attribute_type_id: string
          created_at?: string | null
          id?: string
          product_id: string
          value: string
        }
        Update: {
          attribute_type_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_attribute_type_id_fkey"
            columns: ["attribute_type_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_cover: boolean | null
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          assembly_time_minutes: number | null
          brand: string | null
          category_id: string | null
          cest: string | null
          cfop: string | null
          cofins_aliquota: number | null
          cofins_cst: string | null
          collection: string | null
          cost_price: number | null
          created_at: string | null
          created_by: string | null
          depth_cm: number | null
          description: string | null
          ean: string | null
          fabric_id: string | null
          height_cm: number | null
          icms_aliquota: number | null
          icms_cst: string | null
          id: string
          ipi_aliquota: number | null
          ipi_cst: string | null
          is_kit: boolean | null
          lead_time_days: number | null
          manufacturer: string | null
          material_id: string | null
          name: string
          ncm: string
          notes: string | null
          origin: string | null
          parent_id: string | null
          pis_aliquota: number | null
          pis_cst: string | null
          promo_end_date: string | null
          promo_start_date: string | null
          promotional_price: number | null
          requires_assembly: boolean | null
          selling_price: number | null
          sku: string
          type: string | null
          updated_at: string | null
          warranty_months: number | null
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          active?: boolean | null
          assembly_time_minutes?: number | null
          brand?: string | null
          category_id?: string | null
          cest?: string | null
          cfop?: string | null
          cofins_aliquota?: number | null
          cofins_cst?: string | null
          collection?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          depth_cm?: number | null
          description?: string | null
          ean?: string | null
          fabric_id?: string | null
          height_cm?: number | null
          icms_aliquota?: number | null
          icms_cst?: string | null
          id?: string
          ipi_aliquota?: number | null
          ipi_cst?: string | null
          is_kit?: boolean | null
          lead_time_days?: number | null
          manufacturer?: string | null
          material_id?: string | null
          name: string
          ncm: string
          notes?: string | null
          origin?: string | null
          parent_id?: string | null
          pis_aliquota?: number | null
          pis_cst?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          promotional_price?: number | null
          requires_assembly?: boolean | null
          selling_price?: number | null
          sku: string
          type?: string | null
          updated_at?: string | null
          warranty_months?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          active?: boolean | null
          assembly_time_minutes?: number | null
          brand?: string | null
          category_id?: string | null
          cest?: string | null
          cfop?: string | null
          cofins_aliquota?: number | null
          cofins_cst?: string | null
          collection?: string | null
          cost_price?: number | null
          created_at?: string | null
          created_by?: string | null
          depth_cm?: number | null
          description?: string | null
          ean?: string | null
          fabric_id?: string | null
          height_cm?: number | null
          icms_aliquota?: number | null
          icms_cst?: string | null
          id?: string
          ipi_aliquota?: number | null
          ipi_cst?: string | null
          is_kit?: boolean | null
          lead_time_days?: number | null
          manufacturer?: string | null
          material_id?: string | null
          name?: string
          ncm?: string
          notes?: string | null
          origin?: string | null
          parent_id?: string | null
          pis_aliquota?: number | null
          pis_cst?: string | null
          promo_end_date?: string | null
          promo_start_date?: string | null
          promotional_price?: number | null
          requires_assembly?: boolean | null
          selling_price?: number | null
          sku?: string
          type?: string | null
          updated_at?: string | null
          warranty_months?: number | null
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_deliveries: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          delivery_date: string | null
          id: string
          notes: string | null
          sale_id: string
          scheduled_date: string
          state: string | null
          status: string
          updated_at: string | null
          zipcode: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          sale_id: string
          scheduled_date: string
          state?: string | null
          status?: string
          updated_at?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          delivery_date?: string | null
          id?: string
          notes?: string | null
          sale_id?: string
          scheduled_date?: string
          state?: string | null
          status?: string
          updated_at?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_deliveries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          sale_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          sale_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          sale_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          sale_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          sale_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_document: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_status: string
          discount: number | null
          id: string
          notes: string | null
          payment_status: string
          sale_date: string
          sale_number: string
          status: string
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_document?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_status?: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_status?: string
          sale_date?: string
          sale_number: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_document?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_status?: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_status?: string
          sale_date?: string
          sale_number?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      stocks: {
        Row: {
          available: number | null
          id: string
          max_quantity: number | null
          min_quantity: number | null
          product_id: string
          quantity: number | null
          reorder_point: number | null
          reserved: number | null
          updated_at: string | null
          warehouse_id: string
        }
        Insert: {
          available?: number | null
          id?: string
          max_quantity?: number | null
          min_quantity?: number | null
          product_id: string
          quantity?: number | null
          reorder_point?: number | null
          reserved?: number | null
          updated_at?: string | null
          warehouse_id: string
        }
        Update: {
          available?: number | null
          id?: string
          max_quantity?: number | null
          min_quantity?: number | null
          product_id?: string
          quantity?: number | null
          reorder_point?: number | null
          reserved?: number | null
          updated_at?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          company_name: string | null
          created_at: string | null
          delivery_time_days: number | null
          id: string
          payment_terms: string | null
          person_id: string
          trade_name: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          delivery_time_days?: number | null
          id?: string
          payment_terms?: string | null
          person_id: string
          trade_name?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          delivery_time_days?: number | null
          id?: string
          payment_terms?: string | null
          person_id?: string
          trade_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          active: boolean | null
          address: string | null
          city: string | null
          code: string | null
          created_at: string | null
          id: string
          name: string
          state: string | null
          zipcode: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name: string
          state?: string | null
          zipcode?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string
          state?: string | null
          zipcode?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_sale_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      contact_source:
        | "instagram"
        | "facebook"
        | "fachada"
        | "radio"
        | "outdoor"
        | "google"
        | "youtube"
        | "indicacao"
        | "whatsapp"
        | "website"
        | "outros"
      person_type: "customer" | "employee" | "supplier"
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
      contact_source: [
        "instagram",
        "facebook",
        "fachada",
        "radio",
        "outdoor",
        "google",
        "youtube",
        "indicacao",
        "whatsapp",
        "website",
        "outros",
      ],
      person_type: ["customer", "employee", "supplier"],
    },
  },
} as const
