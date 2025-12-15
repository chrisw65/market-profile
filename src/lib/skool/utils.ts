export function normalizeSlug(slug?: string | null): string {
  if (!slug) {
    return "";
  }
  try {
    const decoded = decodeURIComponent(slug);
    const [firstSegment] = decoded.split("/");
    return firstSegment.replace(/\/+$/, "").trim();
  } catch {
    return slug.split("/")[0].replace(/\/+$/, "").trim();
  }
}
