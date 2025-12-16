import { type CookieOptions } from "@supabase/auth-helpers-nextjs";
import type { RequestCookies } from "next/dist/server/web/spec-extension/cookies";

export function buildCookieStore(storage: RequestCookies) {
  return {
    get(name: string) {
      return storage.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      storage.set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      storage.set({ name, value: "", ...options, maxAge: -1 });
    },
  };
}
