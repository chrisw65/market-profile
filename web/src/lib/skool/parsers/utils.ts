/**
 * Shared utility functions for parsing raw data
 */

/**
 * Returns the first defined value from the source object matching any of the provided keys
 * @param source - The object to search
 * @param keys - Array of keys to check in order
 * @returns The first matching value or undefined
 */
export function firstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
}

/**
 * Returns the first string value from the source object, or fallback
 * @param source - The object to search
 * @param keys - Array of keys to check in order
 * @param fallback - Default value if no string found
 * @returns The first matching string or fallback
 */
export function firstString(
  source: Record<string, unknown>,
  keys: string[],
  fallback = ""
): string {
  const value = firstValue(source, keys);
  return typeof value === "string" ? value : fallback;
}

/**
 * Returns the first numeric value or zero
 * @param source - The object to search
 * @param keys - Array of keys to check in order
 * @returns The first matching number or 0
 */
export function numberOrZero(source: Record<string, unknown>, keys: string[]): number {
  const value = firstValue(source, keys);
  if (typeof value === "number") return value;
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}
