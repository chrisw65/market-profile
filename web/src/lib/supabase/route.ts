import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { buildCookieStore } from "./cookie-store";

export async function createSupabaseRouteClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const storage = await cookies();

  return createServerClient(url, anonKey, {
    cookies: buildCookieStore(storage, { readOnly: true }),
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
