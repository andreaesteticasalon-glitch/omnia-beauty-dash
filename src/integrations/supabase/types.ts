export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          notes: string | null;
          preferences: string | null;
          loyalty_points: number;
          loyalty_tier: LoyaltyTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          preferences?: string | null;
          loyalty_points?: number;
          loyalty_tier?: LoyaltyTier;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          preferences?: string | null;
          loyalty_points?: number;
          loyalty_tier?: LoyaltyTier;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration: number;
          description: string | null;
          category: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          duration: number;
          description?: string | null;
          category?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration?: number;
          description?: string | null;
          category?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          service_id: string | null;
          date: string;
          time: string;
          price: number;
          notes: string | null;
          photo_url: string | null;
          status: AppointmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          service_id?: string | null;
          date: string;
          time: string;
          price: number;
          notes?: string | null;
          photo_url?: string | null;
          status?: AppointmentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          service_id?: string | null;
          date?: string;
          time?: string;
          price?: number;
          notes?: string | null;
          photo_url?: string | null;
          status?: AppointmentStatus;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience aliases
export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
