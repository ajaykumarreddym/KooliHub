import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "admin" | "user" | "guest";
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "user" | "guest";
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "admin" | "user" | "guest";
          phone?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          service_type: string;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          service_type: string;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          service_type?: string;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      service_types: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          icon: string;
          color: string;
          features: any;
          image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description?: string | null;
          icon?: string;
          color?: string;
          features?: any;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          icon?: string;
          color?: string;
          features?: any;
          image_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          discount_price: number | null;
          image_url: string | null;
          category_id: string;
          stock_quantity: number;
          is_active: boolean;
          rating: number | null;
          reviews_count: number;
          sku: string | null;
          brand: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          discount_price?: number | null;
          image_url?: string | null;
          category_id: string;
          stock_quantity?: number;
          is_active?: boolean;
          rating?: number | null;
          reviews_count?: number;
          sku?: string | null;
          brand?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          discount_price?: number | null;
          image_url?: string | null;
          category_id?: string;
          stock_quantity?: number;
          is_active?: boolean;
          rating?: number | null;
          reviews_count?: number;
          sku?: string | null;
          brand?: string | null;
          tags?: string[];
          updated_at?: string;
        };
      };
      serviceable_areas: {
        Row: {
          id: string;
          pincode: string;
          city: string;
          state: string;
          country: string;
          is_serviceable: boolean;
          service_types: string[];
          delivery_time_hours: number | null;
          delivery_charge: number | null;
          coordinates: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pincode: string;
          city: string;
          state: string;
          country?: string;
          is_serviceable?: boolean;
          service_types?: string[];
          delivery_time_hours?: number | null;
          delivery_charge?: number | null;
          coordinates?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pincode?: string;
          city?: string;
          state?: string;
          country?: string;
          is_serviceable?: boolean;
          service_types?: string[];
          delivery_time_hours?: number | null;
          delivery_charge?: number | null;
          coordinates?: any | null;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount: number;
          delivery_address: string;
          delivery_pincode: string;
          service_type: string;
          order_items: any;
          payment_status: "pending" | "completed" | "failed";
          payment_method: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount: number;
          delivery_address: string;
          delivery_pincode: string;
          service_type: string;
          order_items: any;
          payment_status?: "pending" | "completed" | "failed";
          payment_method?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?:
            | "pending"
            | "confirmed"
            | "processing"
            | "shipped"
            | "delivered"
            | "cancelled";
          total_amount?: number;
          delivery_address?: string;
          delivery_pincode?: string;
          service_type?: string;
          order_items?: any;
          payment_status?: "pending" | "completed" | "failed";
          payment_method?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      app_stats: {
        Row: {
          id: string;
          metric_name: string;
          metric_value: number;
          metric_type: "counter" | "gauge" | "histogram";
          service_type: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          metric_name: string;
          metric_value: number;
          metric_type: "counter" | "gauge" | "histogram";
          service_type?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          metric_name?: string;
          metric_value?: number;
          metric_type?: "counter" | "gauge" | "histogram";
          service_type?: string | null;
          date?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper functions for authentication
export const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (userId: string) => {
  console.log("Getting profile for userId:", userId);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log("Profile query result:", {
    data,
    error: error
      ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        }
      : null,
  });

  if (error) {
    const errorInfo = {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      userId,
    };
    console.error("Profile fetch error:", errorInfo);
    throw new Error(
      `Failed to fetch profile: ${error.message || "Unknown error"} (Code: ${error.code || "Unknown"})`,
    );
  }
  return data;
};

export const isAdmin = async (userId: string): Promise<boolean> => {
  try {
    const profile = await getProfile(userId);
    return profile.role === "admin";
  } catch {
    return false;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  console.log("Supabase signIn attempt:", { email, url: supabaseUrl });
  const result = await supabase.auth.signInWithPassword({ email, password });
  console.log("Supabase signIn result:", {
    success: !!result.data.user,
    error: result.error?.message,
    user: result.data.user?.email,
  });
  return result;
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName?: string,
) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};
