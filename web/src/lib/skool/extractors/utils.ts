/**
 * Shared utility functions for data extraction from Skool pages
 */

/**
 * Extracts pageProps from Next.js data structure
 * @param value - The Next.js data object
 * @returns The pageProps object or undefined if not found
 */
export function getPageProps(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || !("props" in value)) {
    return undefined;
  }
  const props = (value as { props?: unknown }).props;
  if (!props || typeof props !== "object" || !("pageProps" in props)) {
    return undefined;
  }
  const pageProps = (props as { pageProps?: unknown }).pageProps;
  if (pageProps && typeof pageProps === "object") {
    return pageProps as Record<string, unknown>;
  }
  return undefined;
}
