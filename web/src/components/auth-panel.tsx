import { AuthPanelClient } from "./auth-panel-client";

const getOrigin = () =>
  process.env.NEXT_PUBLIC_APP_ORIGIN ??
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_URL ??
  "http://localhost:3000";

export async function AuthPanel() {
  const response = await fetch(`${getOrigin()}/api/auth/session`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ user: null }));
  return <AuthPanelClient user={payload.user ?? null} />;
}
