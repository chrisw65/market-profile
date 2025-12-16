import { SkoolPagePayload } from "../fetcher";
import { getPageProps } from "./utils";

export type RawPost = Record<string, unknown>;

const COMMUNITY_ARRAY_KEYS = ["posts", "items", "feed", "data"];
const NESTED_ARRAY_KEYS = ["data", "payload", "result", "collection"];

export function extractCommunityPosts(payload: SkoolPagePayload): RawPost[] {
  const posts: RawPost[] = [];
  const { nextData, ldJson } = payload;

  if (nextData && typeof nextData === "object") {
    const pageProps = getPageProps(nextData);
    if (pageProps) {
      for (const key of COMMUNITY_ARRAY_KEYS) {
        const value = pageProps[key];
        if (Array.isArray(value)) {
          posts.push(...filterRecords(value));
        } else if (isWithItems(value)) {
          posts.push(...filterRecords(value.items));
        }
      }
    }
  }

  // Fallback to ld+json entries
  for (const blob of ldJson) {
    if (Array.isArray(blob)) {
      posts.push(...filterRecords(blob));
    } else if (blob && typeof blob === "object") {
      for (const key of NESTED_ARRAY_KEYS) {
        const arr = (blob as Record<string, unknown>)[key];
        if (Array.isArray(arr)) {
          posts.push(...filterRecords(arr));
        }
      }
    }
  }

  return posts;
}

function filterRecords(entries: unknown[]): RawPost[] {
  return entries.filter((entry): entry is RawPost => typeof entry === "object" && !!entry);
}

type WithItems = { items: unknown[] };

function isWithItems(value: unknown): value is WithItems {
  return Boolean(
    value &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray((value as { items?: unknown }).items)
  );
}
