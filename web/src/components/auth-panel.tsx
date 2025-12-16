import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AuthPanelClient } from "./auth-panel-client";

export async function AuthPanel() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return <AuthPanelClient user={session?.user ?? null} />;
}
