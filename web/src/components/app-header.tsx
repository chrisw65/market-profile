import Link from "next/link";
import { AuthPanel } from "./auth-panel";

export async function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
      <Link href="/" className="text-sm font-semibold text-zinc-900">
        Skool Profiler
      </Link>
      <AuthPanel />
    </header>
  );
}
