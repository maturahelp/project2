/**
 * Database types for Майстор24.
 *
 * Hand-authored to mirror supabase/migrations/20260706120000_initial_schema.sql.
 * Shaped like the output of `supabase gen types typescript` so it can be
 * regenerated in place once the Supabase CLI is wired up:
 *
 *   supabase gen types typescript --project-id <ref> --schema public > lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "maistor" | "client";

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "declined"
  | "completed"
  | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role: UserRole;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          phone?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maistor_profiles: {
        Row: {
          user_id: string;
          slug: string;
          display_name: string | null;
          bio: string | null;
          categories: string[];
          base_city: string | null;
          verified: boolean;
          rating_avg: number;
          rating_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          slug: string;
          display_name?: string | null;
          bio?: string | null;
          categories?: string[];
          base_city?: string | null;
          verified?: boolean;
          rating_avg?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          slug?: string;
          display_name?: string | null;
          bio?: string | null;
          categories?: string[];
          base_city?: string | null;
          verified?: boolean;
          rating_avg?: number;
          rating_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          maistor_id: string;
          title: string;
          description: string | null;
          price_from: number | null;
          price_unit: string | null;
          duration_min: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          maistor_id: string;
          title: string;
          description?: string | null;
          price_from?: number | null;
          price_unit?: string | null;
          duration_min?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          maistor_id?: string;
          title?: string;
          description?: string | null;
          price_from?: number | null;
          price_unit?: string | null;
          duration_min?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      working_hours: {
        Row: {
          id: string;
          maistor_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Insert: {
          id?: string;
          maistor_id: string;
          weekday: number;
          start_time: string;
          end_time: string;
        };
        Update: {
          id?: string;
          maistor_id?: string;
          weekday?: number;
          start_time?: string;
          end_time?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          maistor_id: string;
          client_id: string | null;
          service_id: string;
          status: BookingStatus;
          start_at: string;
          end_at: string;
          address: string | null;
          notes: string | null;
          contact_phone: string | null;
          reminder_sent: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          maistor_id: string;
          client_id?: string | null;
          service_id: string;
          status?: BookingStatus;
          start_at: string;
          end_at: string;
          address?: string | null;
          notes?: string | null;
          contact_phone?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          maistor_id?: string;
          client_id?: string | null;
          service_id?: string;
          status?: BookingStatus;
          start_at?: string;
          end_at?: string;
          address?: string | null;
          notes?: string | null;
          contact_phone?: string | null;
          reminder_sent?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          maistor_id: string;
          client_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          maistor_id: string;
          client_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          maistor_id?: string;
          client_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      maistor_busy_ranges: {
        Args: { p_maistor_id: string; p_from: string; p_to: string };
        Returns: { start_at: string; end_at: string }[];
      };
      create_booking: {
        Args: {
          p_service_id: string;
          p_start_at: string;
          p_address: string | null;
          p_notes: string | null;
          p_contact_phone: string;
        };
        Returns: string;
      };
      claim_due_reminders: {
        Args: { p_within_hours: number };
        Returns: {
          id: string;
          start_at: string;
          contact_phone: string | null;
          service_title: string | null;
          maistor_name: string | null;
          maistor_email: string | null;
          maistor_phone: string | null;
          client_email: string | null;
        }[];
      };
      submit_review: {
        Args: { p_booking_id: string; p_rating: number; p_comment: string | null };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience helpers mirroring the shapes `supabase-js` derives from `Database`. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
