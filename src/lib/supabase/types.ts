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
          table_id: string | null;
          guest_name: string;
          guest_email: string | null;
          phone: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          special_request: string | null;
          status: "pending" | "confirmed" | "cancelled" | "completed";
          created_at: string;
          updated_at: string;
          cancelled_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          table_id?: string | null;
          guest_name: string;
          guest_email?: string | null;
          phone: string;
          party_size: number;
          reservation_date: string;
          reservation_time: string;
          special_request?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          table_id?: string | null;
          guest_name?: string;
          guest_email?: string | null;
          phone?: string;
          party_size?: number;
          reservation_date?: string;
          reservation_time?: string;
          special_request?: string | null;
          status?: "pending" | "confirmed" | "cancelled" | "completed";
          updated_at?: string;
          cancelled_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey";
            columns: ["table_id"];
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_tables: {
        Row: {
          id: string;
          label: string;
          capacity: number;
          zone: string;
          shape: "rect-wide" | "rect-mid" | "rect-tall" | "round";
          layout_x: number;
          layout_y: number;
          layout_width: number;
          layout_height: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          label: string;
          capacity: number;
          zone: string;
          shape: "rect-wide" | "rect-mid" | "rect-tall" | "round";
          layout_x: number;
          layout_y: number;
          layout_width: number;
          layout_height: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          capacity?: number;
          zone?: string;
          shape?: "rect-wide" | "rect-mid" | "rect-tall" | "round";
          layout_x?: number;
          layout_y?: number;
          layout_width?: number;
          layout_height?: number;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_settings: {
        Row: {
          id: number;
          opening_time: string;
          closing_time: string;
          slot_interval_minutes: number;
          max_party_size: number;
          max_advance_days: number;
          total_capacity: number;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          opening_time?: string;
          closing_time?: string;
          slot_interval_minutes?: number;
          max_party_size?: number;
          max_advance_days?: number;
          total_capacity?: number;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          opening_time?: string;
          closing_time?: string;
          slot_interval_minutes?: number;
          max_party_size?: number;
          max_advance_days?: number;
          total_capacity?: number;
          timezone?: string;
          updated_at?: string;
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
    Functions: {
      cancel_reservation: {
        Args: {
          p_reservation_id: string;
        };
        Returns: Database["public"]["Tables"]["reservations"]["Row"];
      };
      create_reservation: {
        Args: {
          p_guest_name: string;
          p_guest_email: string | null;
          p_phone: string;
          p_party_size: number;
          p_reservation_date: string;
          p_reservation_time: string;
          p_table_id: string;
          p_special_request?: string | null;
        };
        Returns: Database["public"]["Tables"]["reservations"]["Row"];
      };
      get_slot_availability: {
        Args: {
          p_reservation_date: string;
          p_party_size?: number;
        };
        Returns: {
          slot_time: string;
          available_seats: number;
          is_available: boolean;
        }[];
      };
      mark_past_reservations_completed: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      reschedule_reservation: {
        Args: {
          p_reservation_id: string;
          p_guest_name: string;
          p_guest_email: string | null;
          p_phone: string;
          p_party_size: number;
          p_reservation_date: string;
          p_reservation_time: string;
          p_table_id: string;
          p_special_request?: string | null;
        };
        Returns: Database["public"]["Tables"]["reservations"]["Row"];
      };
      update_reservation: {
        Args: {
          p_reservation_id: string;
          p_guest_name: string;
          p_guest_email: string | null;
          p_phone: string;
          p_party_size: number;
          p_reservation_date: string;
          p_reservation_time: string;
          p_table_id: string;
          p_special_request?: string | null;
        };
        Returns: Database["public"]["Tables"]["reservations"]["Row"];
      };
    };
    Enums: {
      app_role: "customer" | "admin";
      reservation_status: "pending" | "confirmed" | "cancelled" | "completed";
      table_shape: "rect-wide" | "rect-mid" | "rect-tall" | "round";
    };
    CompositeTypes: Record<string, never>;
  };
};
