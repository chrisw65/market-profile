export function normalizeSlug(slug?: string | null): string {
  if (!slug) {
    return "";
  }
  try {
    const decoded = decodeURIComponent(slug);
    const [firstSegment] = decoded.split("/");
    return firstSegment.replace(/\/+$/, "").trim();
  } catch {
    const [firstSegment] = slug.split("/");
    return firstSegment.replace(/\/+$/, "").trim();
  }
}
