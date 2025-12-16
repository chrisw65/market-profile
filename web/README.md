## Dev Environment

- Requires Node 20+. The project uses Homebrew’s `node@20` (keg-only). Prefix commands with `PATH="/usr/local/opt/node@20/bin:$PATH"` or add it to your shell rc file.
- Install dependencies: `npm install`.
- Copy `.env.example` to `.env` and set Supabase + Ollama variables (for local Supabase via Docker, use `./scripts/supabase-docker.sh start` and the values from `supabase/.env.docker`).

### Run the app

```bash
PATH="/usr/local/opt/node@20/bin:$PATH" npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and click “View Creators Hub Profile” (or go directly to `/profiles/<slug>`).

## Live Skool Profiles

- **Dynamic UI:** `/profiles/[slug]` scrapes the Skool “about” page for the given slug via Playwright, builds the community dossier (value stack, CTAs, ad hooks, owner bio, keyword tags), and renders it server-side.
- **Classroom & Posts:** The same page now shows live classroom modules (title, description, media, course meta) and recent community posts with engagement cues.
- **Auth & Saved Workspaces:** Sign in via magic link (Supabase). Authenticated users can save profiles to their workspace (stored in Supabase) and see them listed on the home page.
- **Alias:** `/creators-hub` simply redirects to `/profiles/the-creators-hub-9795` for quick access.

### API Endpoint

`GET /api/profiles/[slug]`

- Returns an object with:
  - `profile`: community stats, value stack, ad strategy, survey, keywords, media.
  - `classroom`: array of normalized modules (title, description, media, course meta).
  - `posts`: array of normalized community posts (title, content, metadata, nested comments).
- `POST /api/profiles/[slug]/save` – saves the live dossier into the user’s workspace (requires Supabase auth).
- `GET /api/campaign/[slug]` – generates AI campaign ideas using the live profile + Ollama (or fallback summary).
- Example:

```bash
curl http://localhost:3000/api/profiles/the-creators-hub-9795 | jq
```

This endpoint lets you plug any Skool community into downstream AI generation or analytics modules without hitting the UI.
