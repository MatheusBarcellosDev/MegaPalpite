// Database types for Supabase

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          user_id: string;
          numbers: number[];
          explanation: string | null;
          contest_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          numbers: number[];
          explanation?: string | null;
          contest_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          numbers?: number[];
          explanation?: string | null;
          contest_number?: number;
          created_at?: string;
        };
      };
      contests: {
        Row: {
          id: number;
          draw_date: string;
          drawn_numbers: number[] | null;
          jackpot_value: number;
          fetched_at: string;
        };
        Insert: {
          id: number;
          draw_date: string;
          drawn_numbers?: number[] | null;
          jackpot_value: number;
          fetched_at?: string;
        };
        Update: {
          id?: number;
          draw_date?: string;
          drawn_numbers?: number[] | null;
          jackpot_value?: number;
          fetched_at?: string;
        };
      };
      results: {
        Row: {
          id: string;
          game_id: string;
          hits: number;
          checked_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          hits: number;
          checked_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          hits?: number;
          checked_at?: string;
        };
      };
    };
  };
}

export type Game = Database["public"]["Tables"]["games"]["Row"];
export type GameInsert = Database["public"]["Tables"]["games"]["Insert"];
export type Contest = Database["public"]["Tables"]["contests"]["Row"];
export type Result = Database["public"]["Tables"]["results"]["Row"];
