export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      divorce_rate: {
        Row: {
          "Divorce Rate": string | null
          State: string | null
          Year: number | null
          Zip: string | null
        }
        Insert: {
          "Divorce Rate"?: string | null
          State?: string | null
          Year?: number | null
          Zip?: string | null
        }
        Update: {
          "Divorce Rate"?: string | null
          State?: string | null
          Year?: number | null
          Zip?: string | null
        }
        Relationships: []
      }
      divorce_score: {
        Row: {
          "Divorce Rate Score": string | null
          median_divorce_rate: string | null
          scaled_composite_score: number | null
          State: string | null
          zip: string | null
          Zip: string | null
        }
        Insert: {
          "Divorce Rate Score"?: string | null
          median_divorce_rate?: string | null
          scaled_composite_score?: number | null
          State?: string | null
          zip?: string | null
          Zip?: string | null
        }
        Update: {
          "Divorce Rate Score"?: string | null
          median_divorce_rate?: string | null
          scaled_composite_score?: number | null
          State?: string | null
          zip?: string | null
          Zip?: string | null
        }
        Relationships: []
      }
      income: {
        Row: {
          Households: number | null
          Income_bracket: number | null
          State: string | null
          Zip: string | null
        }
        Insert: {
          Households?: number | null
          Income_bracket?: number | null
          State?: string | null
          Zip?: string | null
        }
        Update: {
          Households?: number | null
          Income_bracket?: number | null
          State?: string | null
          Zip?: string | null
        }
        Relationships: []
      }
      income_score: {
        Row: {
          "# of households with more than 200K income": string | null
          "Household Income Score": string | null
          scaled_composite_score: number | null
          State: string | null
          zip: string | null
          Zip: string | null
        }
        Insert: {
          "# of households with more than 200K income"?: string | null
          "Household Income Score"?: string | null
          scaled_composite_score?: number | null
          State?: string | null
          zip?: string | null
          Zip?: string | null
        }
        Update: {
          "# of households with more than 200K income"?: string | null
          "Household Income Score"?: string | null
          scaled_composite_score?: number | null
          State?: string | null
          zip?: string | null
          Zip?: string | null
        }
        Relationships: []
      }
      location: {
        Row: {
          city: string | null
          Competitors: string | null
          county_fips: number | null
          county_fips_all: string | null
          county_name: string | null
          county_names_all: string | null
          county_weights: Json | null
          density: number | null
          "Existing Office": boolean | null
          imprecise: boolean | null
          lat: number | null
          lng: number | null
          military: boolean | null
          parent_zcta: string | null
          population: number | null
          state_id: string | null
          state_name: string | null
          timezone: string | null
          Urbanicity: string | null
          zcta: boolean | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          Competitors?: string | null
          county_fips?: number | null
          county_fips_all?: string | null
          county_name?: string | null
          county_names_all?: string | null
          county_weights?: Json | null
          density?: number | null
          "Existing Office"?: boolean | null
          imprecise?: boolean | null
          lat?: number | null
          lng?: number | null
          military?: boolean | null
          parent_zcta?: string | null
          population?: number | null
          state_id?: string | null
          state_name?: string | null
          timezone?: string | null
          Urbanicity?: string | null
          zcta?: boolean | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          Competitors?: string | null
          county_fips?: number | null
          county_fips_all?: string | null
          county_name?: string | null
          county_names_all?: string | null
          county_weights?: Json | null
          density?: number | null
          "Existing Office"?: boolean | null
          imprecise?: boolean | null
          lat?: number | null
          lng?: number | null
          military?: boolean | null
          parent_zcta?: string | null
          population?: number | null
          state_id?: string | null
          state_name?: string | null
          timezone?: string | null
          Urbanicity?: string | null
          zcta?: boolean | null
          zip?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_normalized_scores: {
        Args: Record<PropertyKey, never>
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
    Enums: {},
  },
} as const
