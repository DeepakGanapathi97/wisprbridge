import { createClient } from "@supabase/supabase-js";

export interface Session {
  id: string;
  pair_code: string;
  device_label?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface Prompt {
  id: string;
  session_id: string;
  text: string;
  is_kept: boolean;
  copied_count: number;
  created_at: string;
  expires_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    !supabaseUrl.includes("placeholder")
  );
};

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
