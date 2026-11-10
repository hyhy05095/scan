export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// This checked-in baseline mirrors the committed public-schema migrations.
// Regenerate it from the linked hosted project with `npm run db:typegen` after
// applying migrations or changing the database through the Supabase Dashboard.
export type Database = {
  public: {
    Tables: {
      payment_orders: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          metadata: Json;
          order_id: string;
          order_name: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          metadata: Json;
          order_id: string;
          order_name: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          metadata?: Json;
          order_id?: string;
          order_name?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          approved_at: string;
          created_at: string;
          currency: string;
          metadata: Json;
          order_id: string;
          order_name: string;
          payment_id: number;
          payment_key: string;
          receipt_url: string;
          requested_at: string;
          status: string;
          total_amount: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          approved_at: string;
          created_at?: string;
          currency?: string;
          metadata: Json;
          order_id: string;
          order_name: string;
          payment_id?: never;
          payment_key: string;
          receipt_url: string;
          requested_at: string;
          status: string;
          total_amount: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          approved_at?: string;
          created_at?: string;
          currency?: string;
          metadata?: Json;
          order_id?: string;
          order_name?: string;
          payment_id?: never;
          payment_key?: string;
          receipt_url?: string;
          requested_at?: string;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          marketing_consent: boolean;
          name: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          marketing_consent?: boolean;
          name: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          marketing_consent?: boolean;
          name?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // sql/scan_logs.sql (루트)
      scan_logs: {
        Row: {
          id: number;
          created_at: string;
          lat: number;
          lng: number;
          accuracy: number | null;
          sign_text: string | null;
          store_id: number | null;
          confidence: number | null;
          user_corrected: boolean;
          corrected_store_id: number | null;
          lang: string | null;
        };
        Insert: {
          lat: number;
          lng: number;
          accuracy?: number | null;
          sign_text?: string | null;
          store_id?: number | null;
          confidence?: number | null;
          user_corrected?: boolean;
          corrected_store_id?: number | null;
          lang?: string | null;
        };
        Update: {
          user_corrected?: boolean;
          corrected_store_id?: number | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      // sql/schema.sql (루트) — 서촌·북촌 가게 후보 조회
      nearby_stores: {
        Args: {
          lat: number;
          lng: number;
          radius_m?: number;
          max_count?: number;
        };
        Returns: {
          id: number;
          name_ko: string;
          name_en: string | null;
          category: string | null;
          lat: number;
          lng: number;
          distance_m: number;
          info: Json;
          is_curated: boolean;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends (PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row;
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer Row;
      }
      ? Row
      : never
    : never;
