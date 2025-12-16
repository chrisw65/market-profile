/**
 * Environment variable validation and type-safe access
 * Validates all required environment variables at startup
 */

import { z } from "zod";

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key is required"),

  // Application URLs
  NEXT_PUBLIC_APP_ORIGIN: z
    .string()
    .url("Invalid app origin URL")
    .optional()
    .or(z.literal("")),
  NEXTAUTH_URL: z.string().url("Invalid NextAuth URL").optional().or(z.literal("")),
  NEXT_PUBLIC_URL: z.string().url("Invalid public URL").optional().or(z.literal("")),

  // AI Configuration (optional)
  OLLAMA_BASE_URL: z.string().url("Invalid Ollama URL").optional().or(z.literal("")),
  OLLAMA_MODEL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error(
      "Invalid environment variables. Check the console output above and your .env file."
    );
  }

  return result.data;
}

// Export validated env
export const env = validateEnv();

/**
 * Get a validated environment variable
 * Use this helper for additional type safety
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === "production";

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === "development";

/**
 * Check if running in test mode
 */
export const isTest = env.NODE_ENV === "test";
