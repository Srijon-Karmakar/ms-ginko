import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const createSupabaseServerClient = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

