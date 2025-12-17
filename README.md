# Market Profile - Skool Community Profiler

A Next.js application that generates AI-ready profiles and marketing campaign ideas for Skool communities. It scrapes community data, builds structured profiles, and uses AI to generate targeted advertising strategies.

## Features

- **Community Scraping**: Extract data from Skool communities using Playwright
- **Profile Building**: Generate comprehensive profiles including posts, classroom content, and member stats
- **AI Campaign Generation**: Create marketing campaign ideas using Ollama (local) or Claude API
- **User Authentication**: Supabase-based authentication and user management
- **Saved Campaigns**: Save and manage campaign ideas for communities
- **Multi-organization Support**: Organization-based workspace management

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth)
- **Scraping**: Playwright
- **AI**: Ollama (local LLM) with Claude API support
- **Validation**: Zod
- **Database**: PostgreSQL with Row Level Security (RLS)

## Prerequisites

- Node.js 20+
- Docker (for local Supabase)
- Ollama (optional, for local AI inference)

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd market-profile
```

### 2. Set up Supabase

#### Option A: Local Development (Docker)

```bash
cd supabase
./scripts/supabase-docker.sh start
```

#### Option B: Supabase Cloud

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Project Settings > API

### 3. Configure environment variables

```bash
cd web
cp .env.example .env
```

Edit `.env` with your Supabase credentials and other configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_ORIGIN=http://localhost:3000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### 4. Install dependencies

```bash
cd web
npm install
```

### 5. Run database migrations

From the repo root (one level above `web/`), pick the option that matches your setup:

```bash
# Local Supabase Docker stack
./scripts/apply-supabase-migrations.sh

# If you're using the Supabase CLI with a linked project
cd supabase
npx supabase db push

# If using Supabase Cloud
# Run the migrations manually in your Supabase SQL editor
```

### 6. Start the development server

```bash
cd web
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

> Profile detail pages require an authenticated Supabase session. Sign in via the top bar (magic link or password) before navigating directly to `/profiles/[slug]` or you will be redirected back to the homepage.

## Project Structure

```
market-profile/
├── web/                      # Next.js application
│   ├── src/
│   │   ├── app/             # Next.js App Router pages & API routes
│   │   ├── components/      # React components
│   │   └── lib/             # Core business logic
│   │       ├── ai/          # AI provider integration
│   │       ├── skool/       # Skool scraping & profiling
│   │       ├── supabase/    # Supabase clients
│   │       └── validation/  # Zod schemas
│   └── public/              # Static assets
├── supabase/                # Supabase configuration
│   ├── migrations/          # Database migrations
│   └── docker-compose.yml   # Local Supabase stack
├── docs/                    # Documentation
└── reference/               # Planning documents
```

## Key Components

### Scraping

- `web/src/lib/skool/fetcher.ts` - Playwright-based page loader with retries
- `web/src/lib/skool/extractors/` - Raw data extraction from pages
- `web/src/lib/skool/parsers/` - Data normalization and validation

### API Routes

- `/api/profiles/[slug]` - Get community profile data
- `/api/profiles/[slug]/save` - Save profile to workspace
- `/api/campaigns` - CRUD operations for saved campaigns
- `/api/campaign/[slug]` - Generate AI campaign ideas
- `/api/auth/*` - Authentication endpoints

### Database Schema

- `organizations` - User workspaces
- `organization_members` - Workspace membership
- `community_profiles` - Scraped community data
- `saved_campaigns` - Generated campaign ideas

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code with Prettier
npx prettier --write .

# Type check
npm run build
```

### Database

```bash
# Reset local database
cd supabase
npx supabase db reset
```

## Architecture Decisions

### Error Handling

- Global ErrorBoundary component for React errors
- Proper try/finally blocks for resource cleanup (Playwright)
- Zod validation for all API inputs

### Security

- Row Level Security (RLS) policies in Supabase
- Service role key only used server-side
- Input validation with Zod schemas
- Authentication required for profile saving and campaigns

### Code Organization

- Shared utilities extracted to avoid duplication
- Parser utilities consolidated in `parsers/utils.ts`
- Extractor utilities in `extractors/utils.ts`
- Validation schemas centralized in `lib/validation/`

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and type checks
4. Commit with clear messages
5. Submit a pull request

## License

[Add your license here]

## Support

For issues and questions, please open a GitHub issue.
