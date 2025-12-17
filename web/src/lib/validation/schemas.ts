/**
 * Zod validation schemas for API endpoints
 */
import { z } from "zod";

/**
 * Slug validation - alphanumeric, hyphens, underscores, 1-100 chars
 */
export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug must be less than 100 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Slug must contain only letters, numbers, hyphens, and underscores");

/**
 * Campaign creation/update schema
 */
export const campaignSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1).max(200).optional(),
  notes: z.string().max(5000).optional(),
  ideas: z.string().max(10000).optional(),
});

/**
 * Campaign deletion schema
 */
export const campaignDeleteSchema = z.object({
  id: z.string().uuid("Invalid campaign ID"),
});

/**
 * User registration schema
 */
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Helper function to safely parse and validate request body
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message).join(", ");
      return { success: false, error: errors };
    }

    return { success: true, data: result.data };
  } catch {
    return { success: false, error: "Invalid JSON body" };
  }
}

/**
 * Helper to validate URL search params
 */
export function validateParams<T>(
  params: Record<string, unknown>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(params);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => issue.message).join(", ");
    return { success: false, error: errors };
  }

  return { success: true, data: result.data };
}
