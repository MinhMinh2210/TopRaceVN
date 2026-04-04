import { supabase } from "@/lib/supabase/client"

export async function createProfile(user: any) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!data) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
    })
  }
}