import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/middleware";
import { AdminUsersClient } from "@/components/admin-users-client";

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Require authentication
  if (!user) {
    redirect("/login");
  }

  // Require admin privileges
  if (!isAdmin(user)) {
    redirect("/dashboard");
  }

  return <AdminUsersClient />;
}
