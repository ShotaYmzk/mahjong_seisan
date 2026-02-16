export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          name: string;
          passphrase: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          passphrase: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          passphrase?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          display_name: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          display_name?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          status: string;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          status?: string;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          status?: string;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_players: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          display_name: string;
          seat_order: number;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          display_name: string;
          seat_order: number;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          display_name?: string;
          seat_order?: number;
        };
        Relationships: [];
      };
      rule_sets: {
        Row: {
          id: string;
          session_id: string;
          starting_points: number;
          return_points: number;
          uma_1: number;
          uma_2: number;
          uma_3: number;
          uma_4: number;
          oka_type: string;
          rate: number;
          rounding_unit: number;
          chip_rate: number;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          starting_points?: number;
          return_points?: number;
          uma_1?: number;
          uma_2?: number;
          uma_3?: number;
          uma_4?: number;
          oka_type?: string;
          rate?: number;
          rounding_unit?: number;
          chip_rate?: number;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          starting_points?: number;
          return_points?: number;
          uma_1?: number;
          uma_2?: number;
          uma_3?: number;
          uma_4?: number;
          oka_type?: string;
          rate?: number;
          rounding_unit?: number;
          chip_rate?: number;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      hanchan: {
        Row: {
          id: string;
          session_id: string;
          seq: number;
          is_confirmed: boolean;
          revision: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          seq: number;
          is_confirmed?: boolean;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          seq?: number;
          is_confirmed?: boolean;
          revision?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      round_results: {
        Row: {
          id: string;
          hanchan_id: string;
          session_id: string;
          player_id: string;
          raw_score: number;
          revision: number;
        };
        Insert: {
          id?: string;
          hanchan_id: string;
          session_id: string;
          player_id: string;
          raw_score: number;
          revision?: number;
        };
        Update: {
          id?: string;
          hanchan_id?: string;
          session_id?: string;
          player_id?: string;
          raw_score?: number;
          revision?: number;
        };
        Relationships: [];
      };
      chip_events: {
        Row: {
          id: string;
          session_id: string;
          from_player_id: string;
          to_player_id: string;
          quantity: number;
          revision: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          from_player_id: string;
          to_player_id: string;
          quantity: number;
          revision?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          from_player_id?: string;
          to_player_id?: string;
          quantity?: number;
          revision?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          session_id: string;
          payer_id: string;
          amount: number;
          description: string | null;
          is_all_members: boolean;
          revision: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          payer_id: string;
          amount: number;
          description?: string | null;
          is_all_members?: boolean;
          revision?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          payer_id?: string;
          amount?: number;
          description?: string | null;
          is_all_members?: boolean;
          revision?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      expense_shares: {
        Row: {
          id: string;
          expense_id: string;
          player_id: string;
          session_id: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          player_id: string;
          session_id: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          player_id?: string;
          session_id?: string;
        };
        Relationships: [];
      };
      activity_log: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          action: string;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          action: string;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          action?: string;
          detail?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      find_room_by_passphrase: {
        Args: { p_passphrase: string };
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
