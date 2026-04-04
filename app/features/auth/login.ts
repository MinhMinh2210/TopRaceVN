import { supabase } from "@/lib/supabase/client"

export async function loginWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "http://localhost:3000"
    }
  })
}