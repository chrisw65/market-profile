#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) {
    return env;
  }
  const contents = fs.readFileSync(filePath, "utf-8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalsIndex = line.indexOf("=");
    if (equalsIndex < 0) continue;
    const key = line.slice(0, equalsIndex);
    let value = line.slice(equalsIndex + 1);
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "..", ".env");
const env = loadEnv(envPath);
Object.assign(process.env, env);

try {
  const undiciModule = await import("undici");
  const undici = undiciModule.default ?? undiciModule;
  if (!globalThis.fetch) {
    globalThis.fetch = undici.fetch;
    globalThis.Headers = undici.Headers;
    globalThis.Request = undici.Request;
    globalThis.Response = undici.Response;
  }
} catch {
  // ignore if undici is unavailable
}

function extractUsers(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (payload.users) return payload.users;
  if (payload.data && Array.isArray(payload.data)) return payload.data;
  if (payload.data?.users) return payload.data.users;
  if (payload?.users?.data) return payload.users.data;
  return [];
}

const [, , email, password, rawOrgName] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/create-admin-user.js <email> <password> [Org Name]");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRole) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in web/.env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false },
});

const orgName = rawOrgName || `${email.split("@")[0]}'s Workspace`;

(async () => {
  try {
    let userId;
    let existing = null;
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
      query: email,
      limit: 1,
    });
    if (listError) {
      throw listError;
    }
    const users = extractUsers(listData);
    if (users.length) {
      existing = users.find((entry) => entry.email?.toLowerCase() === email.toLowerCase());
    }
    if (existing) {
      userId = existing.id;
      console.log(`User ${email} already exists (id: ${userId}). Updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password,
        email_confirmed: true,
      });
      if (updateError) {
        throw updateError;
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirmed: true,
        email_confirmed_at: new Date().toISOString(),
      });
      if (error) {
        throw error;
      }
      userId = data?.user?.id ?? data?.id;
      console.log(`Created Supabase user ${email} (id: ${userId}).`);
      if (!userId) {
        const { data: lookup } = await supabase.auth.admin.listUsers({
          query: email,
          limit: 1,
        });
        const lookupUsers = extractUsers(lookup);
        userId = lookupUsers?.[0]?.id;
      }
    }

    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let organizationId = membership?.organization_id;

    if (!organizationId) {
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: orgName, creator: userId })
        .select("id")
        .single();
      if (orgError && orgError.code !== "23505") {
        throw orgError;
      }
      organizationId = org?.id ?? membership?.organization_id;
      if (!organizationId) {
        throw new Error("Unable to create or find organization.");
      }
      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: userId,
        role: "owner",
      });
      if (memberError) throw memberError;
    }

    console.log("Admin user ready:");
    console.log(`  email: ${email}`);
    console.log(`  password: ${password}`);
    console.log(`  organization_id: ${organizationId}`);
    console.log("Use the credentials above to sign in with the password form.");
  } catch (error) {
    console.error("Failed to create admin user", error);
    process.exit(1);
  }
})();
