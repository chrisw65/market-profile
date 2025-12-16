import { fetchCommunityProfile, type CommunityProfile } from "@/lib/skool/profile";
import { scrapeClassroom, scrapeCommunity } from "@/lib/skool/service";
import { SkoolItem } from "@/lib/skool/schema";
import { ProfileActions } from "@/components/profile-actions";
import { notFound } from "next/navigation";
import { normalizeSlug } from "@/lib/skool/utils";

const StatCard = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
    <p className="text-sm text-zinc-500">{label}</p>
    <p className="mt-1 text-2xl font-semibold text-zinc-900">{value ?? "—"}</p>
  </div>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
    <div>
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {description && <p className="text-sm text-zinc-500">{description}</p>}
    </div>
    {children}
  </section>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-700">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProfilePage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolved = await params;
  const slugParam = resolved?.slug;
  if (!slugParam) {
    notFound();
  }
  const slug = normalizeSlug(slugParam);
  if (!slug) {
    notFound();
  }
  const [profile, classroom, posts]: [CommunityProfile | null, SkoolItem[], SkoolItem[]] =
    await Promise.all([
      fetchCommunityProfile(slug).catch((error) => {
        console.error("profile fetch error", error);
        return null;
      }),
      scrapeClassroom(slug, { maxModules: 12 }).catch((error): SkoolItem[] => {
        console.error("classroom fetch error", error);
        return [];
      }),
      scrapeCommunity(slug, { maxPosts: 12 }).catch((error): SkoolItem[] => {
        console.error("community fetch error", error);
        return [];
      }),
    ]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-zinc-50 py-12 text-zinc-900">
        <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-pink-500">Live Community Snapshot</p>
          <h1 className="text-3xl font-bold">Community data unavailable</h1>
          <p className="text-sm text-zinc-600">
            We couldn’t load the Skool profile for “{slug}.” This usually means the landing page blocked
            the scraper; try again in a few minutes. You can still generate campaign ideas below.
          </p>
          <ProfileActions slug={slug} />
        </div>
      </div>
    );
  }

  const {
    community,
    value_stack,
    ad_strategy,
    keywords,
    survey_questions,
    owner,
  } = profile;

  return (
    <div className="min-h-screen bg-zinc-50 py-12 text-zinc-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6">
        <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-wide text-pink-500">
            Live Community Snapshot
          </p>
          <h1 className="mt-2 text-3xl font-bold">{community.name}</h1>
          <p className="mt-3 text-lg text-zinc-600">{community.tagline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1">
              Plan: {community.plan}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1">
              Privacy: {community.privacy === 1 ? "Members Only" : community.privacy}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-1">
              Updated {community.updated_at ? new Date(community.updated_at).toLocaleDateString() : "—"}
            </span>
          </div>
        </header>
        <ProfileActions slug={community.slug} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Members" value={community.members ?? null} />
          <StatCard label="Online Now" value={community.online_members ?? null} />
          <StatCard label="Posts" value={community.posts ?? null} />
          <StatCard
            label="Courses / Modules"
            value={
              community.courses && community.modules
                ? `${community.courses} / ${community.modules}`
                : null
            }
          />
        </div>

        <Section title="Value Stack" description={`What members experience inside ${community.name}.`}>
          <div className="space-y-4">
            <p className="rounded-2xl bg-pink-50 p-4 text-sm font-medium text-pink-900">
              {value_stack.promise}
            </p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Inside the community
                </h3>
                <BulletList items={value_stack.experience} />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Next steps spotlight
                </h3>
                <BulletList items={value_stack.next_steps} />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Ad & Promotion Strategy" description="Hooks and targeting derived directly from the live landing page.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-2xl bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Hooks</h3>
              <BulletList items={ad_strategy.hooks} />
            </div>
            <div className="space-y-3 rounded-2xl bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Targeting
              </h3>
              <BulletList items={ad_strategy.targeting} />
            </div>
          </div>
          <div className="mt-4 space-y-3 rounded-2xl bg-white">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="text-zinc-500">
                  <th className="px-4 py-2">Angle</th>
                  <th className="px-4 py-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {ad_strategy.angles.map((angle) => (
                  <tr key={angle.name} className="border-t border-zinc-100">
                    <td className="px-4 py-3 font-medium text-zinc-900">{angle.name}</td>
                    <td className="px-4 py-3 text-zinc-600">{angle.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Owner & Research Inputs">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Owner</h3>
              <p className="text-lg font-semibold">{owner.name}</p>
              <p className="text-sm text-zinc-500">{owner.location}</p>
              <p className="mt-3 text-sm text-zinc-600">{owner.bio}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Join Survey</h3>
              <BulletList items={survey_questions.map((q) => q.question)} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Keyword signals</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600"
                >
                  {keyword}
                </span>
              ))}
            </div>
            </div>
          </Section>

        {classroom.length > 0 && (
          <Section
            title="Classroom Modules"
            description="Latest modules pulled directly from the Skool classroom."
          >
            <div className="grid gap-5 md:grid-cols-2">
              {classroom.map((module) => (
                <ModuleCard key={module.id || module.title} module={module} />
              ))}
            </div>
          </Section>
        )}

        {posts.length > 0 && (
          <Section
            title="Community Posts"
            description="Recent posts with AI-ready metadata and engagement cues."
          >
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

const ModuleCard = ({ module }: { module: SkoolItem }) => (
  <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
    <p className="text-xs uppercase tracking-wide text-zinc-400">{module.courseMetaDetails?.title}</p>
    <h3 className="mt-1 text-lg font-semibold text-zinc-900">
      {module.title || module.name || "Untitled Module"}
    </h3>
    <p className="mt-2 line-clamp-4 text-sm text-zinc-600">{module.content}</p>
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
      {module.createdAt && <span>Created {new Date(module.createdAt).toLocaleDateString()}</span>}
      {module.media.length > 0 && <span>{module.media.length} media asset(s)</span>}
    </div>
  </div>
);

const PostCard = ({ post }: { post: SkoolItem }) => {
  const topComments = post.comments.slice(0, 2);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-400">
        <span>{post.postType ?? "post"}</span>
        {post.metadata.comments ? (
          <span>{post.metadata.comments} comments</span>
        ) : null}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-zinc-900">
        {post.postTitle || post.title || "Untitled Post"}
      </h3>
      {post.user && (
        <p className="mt-1 text-sm text-zinc-500">
          By {post.user.name}
          {post.user.metadata.location ? ` • ${post.user.metadata.location}` : ""}
        </p>
      )}
      <p className="mt-2 text-sm text-zinc-600 whitespace-pre-line">{post.content}</p>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
        {post.createdAt && <span>Posted {new Date(post.createdAt).toLocaleDateString()}</span>}
        {post.metadata.upvotes ? <span>{post.metadata.upvotes} upvotes</span> : null}
        {post.metadata.pinned ? <span>📌 Pinned</span> : null}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-pink-500 hover:underline"
          >
            View on Skool ↗
          </a>
        )}
      </div>
      {topComments.length > 0 && (
        <div className="mt-4 rounded-2xl bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Conversation Highlights
          </p>
          <div className="mt-3 space-y-3">
            {topComments.map((comment) => (
              <div key={comment.id}>
                <p className="text-sm font-medium text-zinc-900">
                  {comment.user?.name ?? "Anonymous"}
                  <span className="ml-2 text-xs text-zinc-500">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </p>
                <p className="text-sm text-zinc-600">{comment.content}</p>
                {comment.replies.slice(0, 1).map((reply) => (
                  <p
                    key={reply.id}
                    className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs text-zinc-600"
                  >
                    <span className="font-semibold text-zinc-900">
                      {reply.user?.name ?? "Reply"}
                    </span>
                    : {reply.content}
                  </p>
                ))}
              </div>
            ))}
            {post.comments.length > topComments.length && (
              <p className="text-xs text-zinc-500">
                +{post.comments.length - topComments.length} more comments inside Skool
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
