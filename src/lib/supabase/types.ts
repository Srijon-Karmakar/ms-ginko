export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: "customer" | "admin";
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          role?: "customer" | "admin";
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          id: string;
          user_id: string;
          guest_name: string;
          phone: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          special_request: string | null;
          status: "pending" | "confirmed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          guest_name: string;
          phone: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          special_request?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
          created_at?: string;
        };
        Update: {
          guest_name?: string;
          phone?: string;
          party_size?: number;
          reservation_date?: string;
          reservation_time?: string;
          special_request?: string | null;
          status?: "pending" | "confirmed" | "cancelled";
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          description: string;
          category: string;
          price: number;
          is_vegetarian: boolean;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          category: string;
          price: number;
          is_vegetarian?: boolean;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          description?: string;
          category?: string;
          price?: number;
          is_vegetarian?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };
      gallery_items: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          alt_text: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          alt_text: string;
          sort_order?: number;
        };
        Update: {
          title?: string;
          image_url?: string;
          alt_text?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          reviewer_name: string;
          rating: number;
          quote: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_name: string;
          rating: number;
          quote: string;
          created_at?: string;
        };
        Update: {
          reviewer_name?: string;
          rating?: number;
          quote?: string;
        };
        Relationships: [];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          message: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          message?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: "customer" | "admin";
      reservation_status: "pending" | "confirmed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
