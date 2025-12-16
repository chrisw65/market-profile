import { Comment, CommentMetadata, toISODate } from "../schema";
import { normalizeUser } from "./user";

type RawComment = Record<string, unknown>;

const COMMENT_ID_KEYS = ["id", "comment_id"];

export function normalizeComments(input: unknown): Comment[] {
  const flat: Comment[] = [];
  const records = coerceArray(input);
  for (const record of records) {
    const normalized = coerceComment(record);
    if (normalized) {
      flat.push(normalized);
    }
  }
  return buildTree(flat);
}

function coerceComment(raw: unknown): Comment | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as RawComment;
  const node = (typeof record.post === "object" && record.post) || record;
  if (!node || typeof node !== "object") return undefined;

  const metadata = buildCommentMetadata(node);
  const id = firstString(node, COMMENT_ID_KEYS);
  if (!id) return undefined;

  return {
    id,
    parentId: firstString(node, ["parent_id"]),
    rootId: firstString(node, ["root_id", "rootId"]),
    content: stringOrEmpty(metadata, ["content"]),
    createdAt: toISODate(firstValue(node, ["created_at", "createdAt"])),
    updatedAt: toISODate(firstValue(node, ["updated_at", "updatedAt"])),
    metadata,
    user: normalizeUser(node.user ?? {}),
    replies: [],
  };
}

function buildTree(flat: Comment[]): Comment[] {
  const byId = new Map<string, Comment>();
  flat.forEach((comment) => {
    if (comment.id) {
      byId.set(comment.id, comment);
    }
  });

  const roots: Comment[] = [];
  for (const comment of flat) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies.push(comment);
    } else {
      roots.push(comment);
    }
  }
  return roots;
}

function coerceArray(input: unknown): RawComment[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter((item): item is RawComment => typeof item === "object" && !!item);
  }
  if (isWithItems(input)) {
    return input.items.filter((item): item is RawComment => typeof item === "object" && !!item);
  }
  return [];
}

function buildCommentMetadata(node: Record<string, unknown>): CommentMetadata {
  const meta = (node.metadata as Record<string, unknown>) ?? {};
  return {
    action: numberOrZero(meta, ["action"]),
    upvotes: numberOrZero(meta, ["upvotes"]),
    attachments: stringOrEmpty(meta, ["attachments"]),
    attachments_data: stringOrEmpty(meta, ["attachments_data"]),
  };
}

function numberOrZero(source: Record<string, unknown>, keys: string[]): number {
  const value = firstValue(source, keys);
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringOrEmpty(source: Record<string, unknown>, keys: string[]): string {
  const value = firstValue(source, keys);
  return typeof value === "string" ? value : "";
}

function firstString(source: Record<string, unknown>, keys: string[]): string {
  const value = firstValue(source, keys);
  return typeof value === "string" ? value : "";
}

function firstValue(source: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
}

type ItemsWrapper = { items: unknown[] };

function isWithItems(value: unknown): value is ItemsWrapper {
  return Boolean(
    value &&
    typeof value === "object" &&
    "items" in value &&
    Array.isArray((value as { items?: unknown }).items)
  );
}
