import { loadSkoolPage } from "./fetcher";
import { normalizeSlug } from "./utils";

type SkoolMetadata = {
  displayName?: string;
  description?: string;
  lpDescription?: string;
  plan?: string;
  privacy?: number;
  totalMembers?: number;
  totalOnlineMembers?: number;
  totalPosts?: number;
  numCourses?: number;
  numModules?: number;
  lpAttachmentsData?: string;
  owner?: string;
  survey?: string;
  color?: string;
  [key: string]: unknown;
};

type SkoolGroup = {
  metadata: SkoolMetadata;
  createdAt?: string;
  updatedAt?: string;
};

type SkoolOwnerMetadata = {
  location?: string;
  bio?: string;
  [key: string]: unknown;
};

type SkoolOwner = {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  metadata?: SkoolOwnerMetadata;
};

const STOPWORDS = new Set([
  "a",
  "and",
  "are",
  "be",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "this",
  "to",
  "with",
  "you",
  "your",
  "their",
  "we",
  "us",
  "our",
  "it",
  "that",
  "as",
  "by",
  "an",
  "at",
  "will",
]);

export type CommunityProfile = {
  community: {
    slug: string;
    name?: string;
    tagline?: string;
    hero_statement?: string;
    color?: string;
    plan?: string;
    privacy?: number;
    members?: number;
    online_members?: number;
    posts?: number;
    courses?: number;
    modules?: number;
    created_at?: string;
    updated_at?: string;
  };
  owner: {
    id?: string;
    name?: string;
    location?: string;
    bio?: string;
  };
  value_stack: {
    promise?: string;
    experience: string[];
    next_steps: string[];
  };
  keywords: string[];
  media: Array<{ id?: string; url?: string; small?: string }>;
  survey_questions: Array<{ question: string; type?: string }>;
  ad_strategy: {
    hero_summary?: string;
    hooks: string[];
    angles: Array<{ name: string; message: string }>;
    targeting: string[];
    calls_to_action: string[];
  };
};

const cleanLpText = (text: string) => {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\[ol:1]/g, "")
    .replace(/\[li]/g, "\n- ")
    .replace(/\n{2,}/g, "\n")
    .trim();
};

const parseDescription = (text?: string) => {
  if (!text) {
    return { hero: "", features: [] as string[], actions: [] as string[] };
  }
  const cleaned = cleanLpText(text);
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) {
    return { hero: "", features: [], actions: [] };
  }

  const hero = lines[0];
  const features: string[] = [];
  const actions: string[] = [];
  let inActions = false;
  for (const line of lines.slice(1)) {
    const normalized = line.replace(/^-+\s*/, "").trim();
    if (!normalized) continue;
    if (normalized.toLowerCase().includes("what to do next")) {
      inActions = true;
      continue;
    }
    if (inActions) {
      actions.push(normalized);
    } else {
      features.push(normalized);
    }
  }
  return { hero, features, actions };
};

const extractKeywords = (text: string, limit = 12) => {
  const tokens = text.toLowerCase().match(/[a-z][a-z-]+/g) ?? [];
  const freq = new Map<string, number>();
  for (const token of tokens) {
    if (STOPWORDS.has(token) || token.length < 3) continue;
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
};

const buildAdStrategy = (hero: string, features: string[], actions: string[], keywords: string[]) => {
  const summary = hero;
  const featuresLower = features.join(" ").toLowerCase();
  const hooks: string[] = [];
  const angles: Array<{ name: string; message: string }> = [];

  if (/late|40/.test(summary.toLowerCase())) {
    hooks.push("Late bloomers 40+ finish your book with guided AI support.");
    angles.push({
      name: "Late Bloomer Breakthrough",
      message: "Show how the community helps 40+ creators ship their book with accountability.",
    });
  }

  if (featuresLower.includes("challenge")) {
    hooks.push("5-day Start & Shape Your Book Challenge kicks off soon.");
    angles.push({
      name: "Challenge Momentum",
      message: "Use countdown-themed ads to drive FOMO into the December challenge.",
    });
  }

  if (featuresLower.includes("ai") || keywords.includes("ai")) {
    hooks.push("Simple AI templates remove the tech overwhelm from writing.");
    angles.push({
      name: "AI Co-Author",
      message: "Highlight practical AI walkthroughs tailored for non-technical authors.",
    });
  }

  if (!hooks.length) {
    hooks.push(summary?.slice(0, 140) ?? "Community insight unavailable.");
  }

  const targeting: string[] = [];
  if (summary.toLowerCase().includes("40")) {
    targeting.push("Age 40-65 aspiring authors, writing & creativity interests.");
  }
  if (keywords.includes("ai")) {
    targeting.push("Interest in AI writing tools, ChatGPT, Jasper, Sudowrite.");
  }
  targeting.push("Lookalike audiences from engaged Skool members or email list.");

  const calls_to_action = actions.length
    ? actions
    : [
        "Comment with your book idea.",
        "Join the weekly live training.",
        "Register for the upcoming challenge.",
      ];

  return {
    hero_summary: summary,
    hooks: hooks.slice(0, 3),
    angles: angles.slice(0, 3),
    targeting,
    calls_to_action,
  };
};

export async function fetchCommunityProfile(slug: string): Promise<CommunityProfile | null> {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    console.error(`[fetchCommunityProfile] invalid slug: ${slug}`);
    return null;
  }
  const url = `https://www.skool.com/${normalizedSlug}/about`;
  const payload = await loadSkoolPage(url).catch((error) => {
    console.error(`[fetchCommunityProfile] failed to load ${url}`, error);
    return null;
  });
  if (!payload) {
    return null;
  }
  const group = extractGroup(payload.nextData);
  if (!group) {
    console.error(`[fetchCommunityProfile] unable to locate group for slug '${slug}'`);
    return null;
  }
  return buildProfile(slug, group);
}

const buildProfile = (slug: string, group: SkoolGroup): CommunityProfile => {
  const metadata = group.metadata ?? {};
  const { hero, features, actions } = parseDescription(metadata.lpDescription);
  const combinedText = `${metadata.description ?? ""} ${metadata.lpDescription ?? ""}`;
  const keywords = extractKeywords(combinedText);

  type Attachment = {
    id?: string;
    image?: {
      original_url?: string;
      small_url?: string;
    };
  };

  let attachments: Attachment[] = [];
  if (metadata.lpAttachmentsData) {
    try {
      const parsed = JSON.parse(metadata.lpAttachmentsData as string);
      attachments = parsed.attachments_data ?? [];
    } catch {
      attachments = [];
    }
  }

  let owner: SkoolOwner | undefined;
  try {
    owner = JSON.parse((metadata.owner as string) ?? "{}");
  } catch {
    owner = undefined;
  }
  const ownerMeta = owner?.metadata ?? {};
  let ownerName = owner?.name;
  if (owner?.first_name || owner?.last_name) {
    ownerName = `${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`.trim();
  }

  type Survey = {
    survey?: Array<{ question: string; type?: string }>;
  };

  let survey: Survey = {};
  try {
    survey = JSON.parse((metadata.survey as string) ?? "{}");
  } catch {
    survey = {};
  }

  const ad_strategy = buildAdStrategy(hero, features, actions, keywords);

  return {
    community: {
      slug,
      name: metadata.displayName,
      tagline: metadata.description,
      hero_statement: hero,
      color: metadata.color,
      plan: metadata.plan,
      privacy: metadata.privacy,
      members: metadata.totalMembers,
      online_members: metadata.totalOnlineMembers,
      posts: metadata.totalPosts,
      courses: metadata.numCourses,
      modules: metadata.numModules,
      created_at: group.createdAt,
      updated_at: group.updatedAt,
    },
    owner: {
      id: owner?.id,
      name: ownerName,
      location: ownerMeta.location,
      bio: ownerMeta.bio,
    },
    value_stack: {
      promise: hero,
      experience: features,
      next_steps: actions,
    },
    keywords,
    media: attachments
      .map((item) => ({
        id: item.id,
        url: item.image?.original_url,
        small: item.image?.small_url,
      }))
      .filter((item) => item.url),
    survey_questions: survey.survey ?? [],
    ad_strategy,
  };
};

function extractGroup(data: unknown): SkoolGroup | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }
  const props = (data as { props?: unknown }).props;
  if (!props || typeof props !== "object") {
    return undefined;
  }
  const pageProps = (props as { pageProps?: unknown }).pageProps;
  if (!pageProps || typeof pageProps !== "object") {
    return undefined;
  }
  const currentGroup = (pageProps as { currentGroup?: SkoolGroup }).currentGroup;
  return currentGroup;
}
