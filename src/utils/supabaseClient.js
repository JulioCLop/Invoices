import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://vsqkdewwgdirvawtztwl.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcWtkZXd3Z2RpcnZhd3R6dHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTkwMzMsImV4cCI6MjA3OTg3NTAzM30.4Lc8qcgBfZmPyg8PvEpgZTLog8AD6kqORI_6UMinmJE";

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase environment variables are missing. Set REACT_APP_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and matching anon key."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
