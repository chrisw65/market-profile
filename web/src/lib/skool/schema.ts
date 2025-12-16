export enum ItemType {
  post = "post",
  module = "module",
}

export interface UserMetadata {
  bio?: string;
  pictureBubble?: string;
  pictureProfile?: string;
  location?: string;
  linkWebsite?: string;
  linkYoutube?: string;
  actStatus?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  name: string;
  metadata: UserMetadata;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
}

export interface CommentMetadata {
  action?: number;
  upvotes?: number;
  attachments?: string;
  attachments_data?: string;
}

export interface Comment {
  id: string;
  parentId?: string;
  rootId?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata: CommentMetadata;
  user?: User;
  replies: Comment[];
}

export interface CourseMetaDetails {
  id: string;
  name: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkoolItem {
  type: ItemType;
  id: string;
  name: string;
  title: string;
  postTitle?: string;
  content: string;
  url?: string;
  urlAjax?: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  groupId?: string;
  userId?: string;
  postType?: string;
  rootId?: string;
  parentId?: string;
  labelId?: string;
  user?: User;
  comments: Comment[];
  media: string[];
  courseMetaDetails?: CourseMetaDetails | null;
}

export const toISODate = (value: unknown): string | undefined => {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};
