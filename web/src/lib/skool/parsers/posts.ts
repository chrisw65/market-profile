import { ItemType, SkoolItem, toISODate } from "../schema";
import { normalizeUser } from "./user";
import { normalizeComments } from "./comments";
import { firstValue, numberOrZero } from "./utils";

type RawPost = Record<string, unknown>;

export function normalizePost(raw: RawPost): SkoolItem {
  const meta = (raw.metadata as Record<string, unknown>) ?? (raw.meta as Record<string, unknown>) ?? {};
  const core = (typeof raw.post === "object" && raw.post) || raw;
  const commentsRaw = core?.comments ?? raw.comments ?? [];

  return {
    type: ItemType.post,
    id: stringField(core, ["id", "post_id", "uuid"]),
    name: stringField(core, ["name", "slug"]),
    title: stringField(core, ["title", "postTitle"]) || stringField(meta, ["title"]),
    postTitle: stringField(core, ["postTitle", "title"]),
    content: stringField(core, ["content"]) || stringField(meta, ["content"]),
    url: stringField(core, ["url"]) || stringField(raw, ["url"]),
    urlAjax: stringField(core, ["urlAjax"]) || stringField(raw, ["urlAjax"]),
    metadata: buildMetadata(core, meta),
    createdAt: toISODate(firstValue(core, ["createdAt", "created_at"])),
    updatedAt: toISODate(firstValue(core, ["updatedAt", "updated_at"])),
    groupId: stringField(core, ["groupId"]) || stringField(raw, ["groupId"]),
    userId: stringField(core, ["userId"]) || stringField(raw, ["userId"]),
    postType: stringField(core, ["postType", "type"], "generic"),
    rootId: stringField(core, ["rootId"]) || stringField(raw, ["rootId"]) || stringField(core, ["id"]),
    parentId: stringField(core, ["parent_id"]),
    labelId: stringField(core, ["labelId"]) || stringField(meta, ["labels"]),
    user: normalizeUser(core?.user),
    comments: normalizeComments(commentsRaw),
    media: [],
    courseMetaDetails: null,
  };
}

function buildMetadata(core: RawPost, meta: Record<string, unknown>) {
  return {
    action: numberOrZero(meta, ["action"]),
    comments:
      numberOrZero(meta, ["comments"]) ||
      numberOrZero(core, ["commentsCount"]),
    upvotes: numberOrZero(meta, ["upvotes"]) || numberOrZero(core, ["upvotes"]),
    pinned: numberOrZero(meta, ["pinned"]) || numberOrZero(core, ["pinned"]),
    imagePreview: stringField(meta, ["imagePreview"]),
    imagePreviewSmall: stringField(meta, ["imagePreviewSmall"]),
    videoLinksData: stringField(meta, ["videoLinksData"]),
    contributors: stringField(meta, ["contributors"]),
    labels: stringField(meta, ["labels"]) || stringField(core, ["labelId"]),
    hasNewComments: numberOrZero(meta, ["hasNewComments"]),
    lastComment: numberOrZero(meta, ["lastComment"]),
  };
}

function stringField(
  source: Record<string, unknown> | undefined,
  keys: string[],
  fallback = ""
): string {
  if (!source) return fallback;
  const value = firstValue(source, keys);
  return typeof value === "string" ? value : fallback;
}
