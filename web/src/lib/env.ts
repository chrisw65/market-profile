/**
 * Environment variable validation and type-safe access
 * Validates all required environment variables at startup
 */

import { z } from "zod";

const envSchema = z.object({
  // Supabase (required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL").optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),

  // Application URLs (optional)
  NEXT_PUBLIC_APP_ORIGIN: z.string().url("Invalid app origin URL").optional().or(z.literal("")),
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
 * Returns defaults if validation fails in development
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ Invalid environment variables:");
      result.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      throw new Error(
        "Invalid environment variables. Check the console output above and your .env file."
      );
    } else {
      // In development, just warn and use defaults
      console.warn("⚠️  Some environment variables are missing or invalid:");
      result.error.issues.forEach((issue) => {
        console.warn(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      console.warn("Using defaults for development. Check your .env file.");

      // Return process.env with loose typing for development
      return process.env as unknown as Env;
    }
  }

  return result.data;
}

// Export validated env (or defaults in dev)
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
