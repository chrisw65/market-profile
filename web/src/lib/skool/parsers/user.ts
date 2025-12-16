import { User, UserMetadata, toISODate } from "../schema";

const USER_ID_KEYS = ["id", "userId", "user_id"];
const USER_NAME_KEYS = ["name", "username"];
const FIRST_NAME_KEYS = ["firstName", "first_name"];
const LAST_NAME_KEYS = ["lastName", "last_name"];

export function normalizeUser(raw: unknown): User | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const metadata = buildMetadata((record.metadata as Record<string, unknown>) ?? {});

  const id = firstString(record, USER_ID_KEYS);
  const name = firstString(record, USER_NAME_KEYS);

  if (!id && !name) return undefined;

  return {
    id,
    name,
    metadata,
    createdAt: toISODate(firstValue(record, ["createdAt", "created_at"])),
    updatedAt: toISODate(firstValue(record, ["updatedAt", "updated_at"])),
    firstName: firstString(record, FIRST_NAME_KEYS),
    lastName: firstString(record, LAST_NAME_KEYS),
  };
}

function buildMetadata(meta: Record<string, unknown>): UserMetadata {
  return {
    bio: stringOrEmpty(meta, ["bio", "Bio"]),
    pictureBubble: stringOrEmpty(meta, ["pictureBubble", "picture_bubble"]),
    pictureProfile: stringOrEmpty(meta, ["pictureProfile", "picture_profile"]),
    location: stringOrEmpty(meta, ["location"]),
    linkWebsite: stringOrEmpty(meta, ["linkWebsite", "website"]),
    linkYoutube: stringOrEmpty(meta, ["linkYoutube", "youtube"]),
    actStatus: stringOrEmpty(meta, ["actStatus", "status"]),
  };
}

function firstString(source: Record<string, unknown>, keys: string[], fallback = ""): string {
  const value = firstValue(source, keys);
  return typeof value === "string" ? value : fallback;
}

function stringOrEmpty(source: Record<string, unknown>, keys: string[]): string {
  return firstString(source, keys, "");
}

function firstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
}
