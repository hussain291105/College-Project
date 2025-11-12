import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types"; // ✅ Make sure this path is correct

// ✅ Load environment variables (defined in .env or .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ Check for missing values and provide a clear error
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  throw new Error("Supabase URL or Anon key not found in environment variables.");
}

// ✅ Create the Supabase client, typed with your Database schema
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // 🆕 ensures OAuth flows work properly
  },
});

// ✅ Optional: Helper type exports (makes imports easier elsewhere)
export type SupabaseClient = typeof supabase;
export type Tables = Database["public"]["Tables"];
export type TablesInsert<K extends keyof Tables> = Tables[K]["Insert"];
export type TablesUpdate<K extends keyof Tables> = Tables[K]["Update"];
