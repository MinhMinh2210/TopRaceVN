import { supabase } from "@/lib/supabase/client"

export async function testConnection() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1)

  return { data, error }
}