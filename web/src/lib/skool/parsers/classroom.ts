import { ItemType, SkoolItem, CourseMetaDetails, toISODate } from "../schema";
import { RawModule } from "../extractors/classroom";

const COURSE_META_KEYS = ["courseMetaDetails", "course", "about", "inCourse"];
const MEDIA_KEYS = ["media", "video", "videos", "mediaLinks", "mediaLink"];

export function normalizeModule(raw: RawModule): SkoolItem {
  const media = collectMedia(raw);
  const courseMetaDetails = extractCourseMeta(raw);

  return {
    type: ItemType.module,
    id: stringField(raw, ["id", "@id"]),
    name: stringField(raw, ["name"]),
    title: stringField(raw, ["title"]),
    postTitle: stringField(raw, ["postTitle", "title"]),
    content: stringField(raw, ["content", "description"]),
    url: stringField(raw, ["url"]),
    urlAjax: stringField(raw, ["urlAjax"]),
    metadata: {},
    createdAt: toISODate(getValue(raw, ["createdAt", "dateCreated"])),
    updatedAt: toISODate(getValue(raw, ["updatedAt", "dateModified"])),
    groupId: stringField(raw, ["groupId"]),
    userId: stringField(raw, ["userId"]),
    postType: stringField(raw, ["type"], "module"),
    rootId: stringField(raw, ["rootId"]),
    parentId: stringField(raw, ["parent_id"]),
    labelId: stringField(raw, ["labelId"]),
    user: undefined,
    comments: [],
    media,
    courseMetaDetails,
  };
}

function collectMedia(raw: RawModule): string[] {
  const media: string[] = [];
  for (const key of MEDIA_KEYS) {
    const value = raw[key];
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string" && entry.trim()) {
          media.push(entry.trim());
        }
      }
    } else if (typeof value === "string" && value.trim()) {
      media.push(value.trim());
    }
  }
  return media;
}

function extractCourseMeta(raw: RawModule): CourseMetaDetails | null {
  for (const key of COURSE_META_KEYS) {
    const value = raw[key];
    if (value && typeof value === "object") {
      return {
        id: stringField(value, ["id", "@id", "courseId"]),
        name: stringField(value, ["name", "slug"]),
        title: stringField(value, ["title", "headline", "name"]),
        createdAt: toISODate(getValue(value, ["createdAt", "dateCreated"])),
        updatedAt: toISODate(getValue(value, ["updatedAt", "dateModified"])),
      };
    }
  }
  return null;
}

function stringField(
  raw: Record<string, unknown>,
  keys: string[],
  fallback = ""
): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return fallback;
}

function getValue(
  raw: Record<string, unknown>,
  keys: string[]
): unknown {
  for (const key of keys) {
    if (key in raw) {
      return raw[key];
    }
  }
  return undefined;
}
