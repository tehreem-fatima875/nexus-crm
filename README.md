# Nexus CRM

A CRM workspace for web development and digital marketing agencies, built with the Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, Recharts, and the MongoDB Node.js driver.

## Local setup

1. Install dependencies with `npm install`.
2. For local MongoDB-backed development, place `MONGODB_URI` in the ignored root `.env.local`. The app selects only the `nexus_crm` database. Keep the URI server-side.
3. Start the development server with `npm run dev` and open `http://localhost:3000`. No sign-in is required. Bind development servers to loopback only; local development routes can write to the configured `nexus_crm` database.

In production, the public demo uses the synthetic examples in `src/data/demo-data.ts`; its API does not read the configured MongoDB database. Public reads are allowed, and all create, update, and delete API requests return HTTP 403. This prevents visitors from seeing CRM records from MongoDB or changing them. The MongoDB connection helper remains server-only and is used by local development only.

For Netlify, connect the repository and deploy the Next.js app using the site's normal build configuration. No authentication or database environment variables are required for the public read-only demo. Do not add `MONGODB_URI` to the public deployment: production routes use fixture data and deny writes.

## CRM routes

- `/dashboard` — overview and analytics calculated from the CRM records served to the Leads and Deals pages, including monthly won revenue by close date.
- `/leads` and `/leads/[id]` — lead directory and lead records
- `/contacts` and `/contacts/[id]` — contact directory and profiles
- `/companies` and `/companies/[id]` — company directory and account profiles
- `/deals` and `/deals/[id]` — sales pipeline and deal records
- `/activities` — tasks, calls, meetings, notes, and follow-ups
- `/projects` and `/projects/[id]` — client delivery projects
- `/reports` — analytics and deal CSV export
- `/ai-assistant` — planned AI workflows and editable user-authored drafts; no AI provider is connected
- `/settings` — local demo preferences and informational team/role settings

The production CRM API provides sample-data reads at `/api/crm` and `/api/crm/{leads,contacts,companies,deals,activities,projects}`, plus item reads at `/api/crm/{collection}/{id}`. Production create, update, and delete operations are intentionally disabled. Local development API routes retain MongoDB CRUD support.

The production sample owner list and CRM records are fixed synthetic demo data. Changes made through forms are not persisted there; the API reports that the public demo is read-only. Local development forms continue using MongoDB persistence.

## Security and production status

The public demo requires no account and exposes only synthetic sample data. CRM write endpoints are disabled. This is suitable for demonstration, not for handling private customer data or accepting public user submissions.

Settings, team role selections, notification preferences, and display preferences remain page-local demo controls because there is no authenticated workspace/user model to scope them to. AI generation, summarization, and notification delivery are not connected. The database-backed CRUD implementation is intentionally not active in this public read-only deployment.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
