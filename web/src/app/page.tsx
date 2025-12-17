import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/middleware";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect based on authentication status and role
  if (user) {
    if (isAdmin(user)) {
      redirect("/admin/users");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
