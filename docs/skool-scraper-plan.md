# Skool Scraper Parity Plan

This document captures the structure of the reference Python scraper (`tmp/skool-scraper`) and maps its features to the TypeScript implementation we are building inside `web/`.

## 1. Reference Python Architecture (Survey)

File | Purpose | Notes
---- | ------- | -----
`src/extractors/community_scraper.py` | Fetches Skool “Community” tab pages over HTTP (requests + BeautifulSoup). Extracts all `<script>` JSON blobs, looks for Next.js `__NEXT_DATA__` payloads and other JSON, then yields raw post-like dicts (`iter_items`). Supports retries, `max_items`, and optional comments. | No authenticated API calls; relies on public page HTML.
`src/extractors/classroom_scraper.py` | Similar to community scraper but targets the “Classroom” tab. Pulls modules/courses from Next.js payloads or `ld+json` tags (`Course`, `LearningResource`). | Again, HTML scraping without authentication.
`src/parsers/posts.py` | Normalizes raw post dicts into a unified `SkoolItem` model (`ItemType.post`). Handles multiple field name variants (id/name/title), attaches metadata (engagement, labels, media), resolves `user` via `_coerce_user`, and normalizes nested comments via `parsers/comments.py`. | Depends on `outputs/schema.py` dataclasses.
`src/parsers/comments.py` | Recursively normalizes comment trees: each comment’s `post` object is coerced into `Comment` objects with metadata and user info. | Ensures parent/root IDs are preserved for thread reconstruction.
`src/parsers/classroom.py` | Converts classroom module/course payloads into `SkoolItem` with `ItemType.module`, capturing media arrays and `courseMetaDetails`. | Accepts schema.org-style JSON as fallback.
`src/outputs/schema.py` | Dataclass definitions for `SkoolItem`, `Comment`, `User`, `CourseMetaDetails`, plus helper enums. | Serves as the canonical output schema.
`src/outputs/exporters.py` | Serializes normalized items to JSON/NDJSON/CSV. | Not needed immediately but useful reference for data layout.
`src/runner.py` | CLI entrypoint that wires extractors + parsers + exporters using a JSON config (see `config/settings.example.json`). | Shows orchestration flow.

**Key observations**
- Entire stack is HTML-powered (no official API auth). We need a headless browser or fetch + DOM parser in TS.
- Output schema revolves around `SkoolItem` plus arrays for comments/media/course meta.
- Comments are embedded within posts when available; there’s no separate fetch in the base scraper.
- For classroom content, modules may be nested under `pageProps.course.modules` or LD+JSON; we need to scan multiple keys.

## 2. TypeScript Architecture (Design)

### Modules to implement
1. **Core fetcher (`lib/skool/fetch.ts`)**
   - Uses Playwright (already installed) to load Skool pages with retries, custom user agent, and optional cookie/auth hooks.
   - Returns the page HTML + parsed `__NEXT_DATA__` JSON to avoid reparsing downstream.

2. **Extractor layer (`lib/skool/extractors.ts`)**
   - `extractCommunityItems(nextData: any): RawPost[]`
   - `extractClassroomModules(nextData: any): RawModule[]`
   - Includes LD+JSON fallback parser using `JSON.parse` on `<script type="application/ld+json">`.
   - Mirrors the Python heuristics (`pageProps.posts/items/feed/data`, nested `course.modules`, etc.).

3. **Parser layer (`lib/skool/parsers`)**
   - `normalizePost(raw: RawPost): SkoolItemPost`
   - `normalizeComments(rawComments: RawComment[]): Comment[]`
   - `normalizeModule(raw: RawModule): SkoolItemModule`
   - Data types modeled after `outputs/schema.py`, e.g.:
     ```ts
     interface SkoolItem {
       type: "post" | "module";
       id: string;
       name: string;
       title: string;
       postTitle: string;
       content: string;
       url: string;
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
       courseMetaDetails?: CourseMetaDetails;
     }
     ```

4. **Service layer (`lib/skool/service.ts`)**
   - Public functions used by API/UI:
     - `scrapeCommunity({ slug, includeComments, maxItems })`
     - `scrapeClassroom({ slug, maxModules })`
   - Each service orchestrates fetch → extract → normalize, returning structured arrays ready for UI.

5. **Integration with existing profile endpoint**
   - Extend `/api/profiles/[slug]` to optionally include classroom modules/posts (e.g., query params `?sections=community,classroom`).
   - Update UI to render new sections (Classroom overview, top lessons, etc.).

### Technical considerations
- **Playwright sharing**: To avoid repeated Chromium downloads, reuse the current `fetchCommunityProfile` helper’s Playwright context but abstract into a shared fetcher module so both profile + scraper use it.
- **Retries/timeouts**: Mirror Python behavior (3 retries, exponential backoff). Wrap Playwright navigation in try/catch.
- **Performance**: For now we can fetch sequentially; later we can parallelize with Promise.all if targeting multiple tabs per request.
- **Testing**: Create Jest/Playwright unit tests for parsers using fixtures derived from the Python repo’s sample JSON.

Next step (3) will be implementing these modules, starting with the classroom extractor + parser so we can display classroom content for The Creator’s Hub.

---

## 3. Implementation Plan (in progress)

We will tackle implementation in the following order:

1. **Shared Types & Schema (`lib/skool/schema.ts`)**
   - Define `SkoolItem`, `Comment`, `User`, `CourseMetaDetails`, enums.
   - Provide type guards + helper functions for ISO date coercion.

2. **HTML Fetcher (`lib/skool/fetch.ts`)**
   - Expose `loadSkoolPage(url)` returning `{ html, nextData, ldJson }`.
   - Handles retries/backoff and shares a Chromium instance for efficiency.

3. **Extractors (`lib/skool/extractors/community.ts`, `classroom.ts`)**
   - Convert `nextData` + `ldJson` into raw arrays: `RawPost[]`, `RawModule[]`.

4. **Parsers (`lib/skool/parsers/posts.ts`, `classroom.ts`, `comments.ts`, `user.ts`)**
   - Normalize raw data into schema objects with deterministic field handling.

5. **Services (`lib/skool/service.ts`)**
   - High-level functions `scrapeCommunity(slug)` and `scrapeClassroom(slug)` orchestrating fetch → extract → parse.

6. **API/UI integration**
   - Expand `/api/profiles/[slug]` to include community + classroom data.
   - Update UI to render classroom modules and top posts sections.

Implementation will start now, beginning with the shared schema/types and fetcher modules.
