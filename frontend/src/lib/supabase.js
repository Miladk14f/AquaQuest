import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Only create a real client when real credentials are provided
const isConfigured =
  url.startsWith("https://") && !url.includes("YOUR PROJECT REF") &&
  key.length > 20 && !key.includes("PASTE");

export const supabase = isConfigured
  ? createClient(url, key)
  : null;

export const supabaseConfigured = isConfigured;
