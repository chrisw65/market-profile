# Phase 1 Execution Plan & Profile Builder PoC

This document translates the reference build plan into a concrete execution blueprint for Phase 1 (Weeks 0‑8) and describes the first PoC we need to ship: the Skool Community Profile Builder.

---

## 1. Phase 1 Goals (Weeks 0‑8)

| Week | Milestones | Key Outcomes |
| --- | --- | --- |
| 0‑1 | Discovery & validation | • Interviews/surveys with AI Operator Academy + Creators Hub<br>• Figma prototype for campaign wizard + AI copy review<br>• Dev env ready (Next.js 14 + Supabase + Prisma) |
| 2‑3 | Platform foundation | • Auth, org, brand CRUD via Supabase<br>• Credits ledger + tier rules stubbed<br>• Base UI shell with shadcn components |
| 3‑5 | Brand & copy engine | • Conversational brand interview<br>• Claude/Ollama provider abstraction<br>• Facebook image ad generation with variation storage |
| 5‑6 | Campaign wizard v1 | • Steps for objective, platform, audience, brand voice, assets review<br>• Manual export/share (PDF/CSV) |
| 6‑7 | Basic analytics | • Manual data entry for impressions/clicks/spend<br>• Metrics grid + chart components<br>• AI insights stub (static prompt) |
| 7‑8 | Beta readiness | • Stripe single-tier checkout + credit metering<br>• Beta onboarding + docs<br>• Dogfood across AI Operator Academy & Creators Hub |

### Success Metrics
- 100 beta users onboarded
- 500 ads generated
- ≥10 paying customers on starter tier
- Qualitative NPS ≥30 from internal communities

### Dependencies & Risks
- **Claude vs Ollama**: provider abstraction ready on day 1; GPU inference on Jetson accessible via VPN/LAN.
- **Supabase schema**: finalize Prisma models for User/Organization/Brand/Campaign/Ad before sprint 2.
- **Design debt**: keep UI kit lightweight (shadcn defaults) to focus on workflows.
- **Cost controls**: implement credit throttling + prompt caching as soon as ad generation ships.

---

## 2. Workstream Breakdown

### A. Product Discovery & Prototype
- Survey template covering pains, tool stack, willingness to pay.
- Figma prototype of: dashboard, campaign wizard (steps 1‑5), AI copy review modal.
- Usability sessions (record + synthesize insights).

### B. Platform Foundations
- Repo setup: `apps/web` (Next.js), `packages/db` (Prisma schema), `packages/ai` (provider abstraction).
- Supabase auth with email magic links + organizations table (user ↔ org membership).
- Credits ledger per organization (table + API stub).

### C. Brand Intelligence & AI Engine
- Conversational interview component using message history + Claude or Ollama.
- Store outputs in `brand.voiceProfile`, `brand.targetAudience`, `brand.valueProposition`.
- AI service module: `providers/claude.ts`, `providers/ollama.ts`, orchestrator selects based on config.
- Facebook image ad generator UI: request builder, response diffing, accept/save variations.

### D. Campaign Wizard & Export
- Steps: Objective → Platforms → Audience → Brand Voice → AI Review → Assets/Export.
- Persist drafts, allow resume.
- Export: PDF/CSV with ad copy + targeting suggestions.

### E. Analytics & Beta Prep
- Manual data entry form for impressions/clicks/spend per campaign.
- Charts (line, bar) + metrics cards.
- AI insight stub (prompt + display).
- Stripe checkout (single plan), usage tracking, onboarding docs.

---

## 3. Profile Builder PoC (Test Build)

### Objective
Accept a Skool community identifier (e.g., “AI Operator Academy” or “Creators Hub”), ingest available data, and output a structured profile + initial engagement/growth recommendations.

### Inputs
- Skool API key + community ID (or CSV export for PoC).
- Optional supplemental data: landing page URL, recent content links, survey responses.

### Pipeline
1. **Data Ingestion**
   - Skool members: name, tags, join date, engagement stats.
   - Posts: title, content, engagement (likes/comments).
   - Manual metrics: conversion to paid, churn notes.
2. **Feature Extraction**
   - Segment members by role, tenure, activity.
   - Identify top-performing topics/posts.
   - Compute engagement trends (e.g., replies/post).
3. **AI Analysis**
   - Prompt template feeds structured JSON (audience personas, pains, goals, proof points).
   - Generate SWOT-style summary + positioning statements.
4. **Plan Generation**
   - Engagement plan (weekly cadence, spotlight ideas).
   - Growth plan (lead magnets, referral hooks, paid angles).
   - Messaging pack (hero statement, hooks, CTAs).

### Output Schema (Draft)
```json
{
  "community": {
    "name": "AI Operator Academy",
    "stage": "Growth",
    "memberCount": 742,
    "icpSegments": [
      { "label": "AI Operators", "needs": ["predictable lead gen", "community case studies"] },
      { "label": "Creators", "needs": ["collab network", "monetization playbooks"] }
    ]
  },
  "engagement": {
    "healthScore": 72,
    "topFormats": ["wins thread", "AMA"],
    "levers": ["weekly challenge", "member spotlights"]
  },
  "growthStrategy": {
    "organic": ["YouTube teardown series", "LinkedIn carousels"],
    "paid": [
      { "platform": "Meta", "angle": "Before/After Skool growth", "budgetRecommendation": 30 }
    ],
    "referrals": ["buddy pass", "creator residency"]
  }
}
```

### MVP Implementation Plan
1. **Data Loader Stub (Week 1)**  
   - Mock JSON for AI Operator Academy + Creators Hub.  
   - API route `/api/profile/:communityId` returning sample data.
2. **Analyzer Service (Week 2)**  
   - Prompt template referencing mock data; run via Claude or Jetson Ollama.  
   - Parse JSON, validate schema, store in Supabase (`community_profile` table).
3. **UI Prototype (Week 3)**  
   - Page with selectable community, profile summary cards, engagement plan, growth plan.  
   - “Generate Ads” CTA linking to campaign wizard pre-filled with recommended messaging.
4. **Feedback Loop (Week 4)**  
   - Share with internal teams, collect accuracy/utility feedback.  
   - Add manual override notes + ability to edit AI output before saving.

### Future Enhancements
- Real Skool API integration, scheduled sync.
- Vector store for historic content to enable richer analysis.
- Benchmarking against anonymized community dataset for comparative insights.

---

## 4. Immediate Next Actions
1. Create repo structure + install Next.js 14, Supabase, Prisma, shadcn.  
2. Implement provider abstraction hitting Claude + Jetson Ollama.  
3. Build mock data + `/api/profile` endpoint to unblock PoC UI.  
4. Draft Figma screens for dashboard, campaign wizard, profile view.  
5. Schedule interviews with leaders of AI Operator Academy & Creators Hub to validate profile outputs.
