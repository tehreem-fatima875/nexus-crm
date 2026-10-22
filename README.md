# Nexus CRM

A CRM workspace for web development and digital marketing agencies, built with the Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, Recharts, and the MongoDB Node.js driver.

## Local setup

1. Install dependencies with `npm install`.
2. Place `MONGODB_URI` in the ignored root `.env.local`. The app always selects only the `nexus_crm` database, regardless of the database name in the URI. Keep the URI server-side.
3. Start the development server with `npm run dev` and open `http://localhost:3000`. No sign-in is required. Bind development servers to loopback only; local development routes can write to the configured `nexus_crm` database.

The public demo has no sign-in. Both local and production CRM reads use the same `nexus_crm` database, and dashboards/reports are calculated from those records. Configure the server-only `MONGODB_URI` environment variable in Netlify using a MongoDB user that can read CRM collections and insert leads in the `nexus_crm` database. Production lead creation is enabled; other create, update, and delete requests return HTTP 403. Local development retains MongoDB CRUD support.

For Netlify, connect the repository and deploy the Next.js app using the site's normal build configuration. Set `MONGODB_URI` for the production deploy context (and deploy previews if they should display the same database). No `MONGODB_DB`, `MONGODB_URL`, or `NEXT_PUBLIC_*` database variable is used; the selected database is fixed to `nexus_crm` in server code.

## CRM routes

- `/dashboard` — overview and analytics calculated from the CRM records served to the Leads and Deals pages, including monthly won revenue by close date and empty states when there are no records.
- `/leads` and `/leads/[id]` — lead directory and lead records
- `/contacts` and `/contacts/[id]` — contact directory and profiles
- `/companies` and `/companies/[id]` — company directory and account profiles
- `/deals` and `/deals/[id]` — sales pipeline and deal records
- `/activities` — tasks, calls, meetings, notes, and follow-ups
- `/projects` and `/projects/[id]` — client delivery projects
- `/reports` — analytics and deal CSV export
- `/ai-assistant` — planned AI workflows and editable user-authored drafts; no AI provider is connected
- `/settings` — local demo preferences and informational team/role settings

The CRM API reads all records from MongoDB at `/api/crm`, `/api/crm/{leads,contacts,companies,deals,activities,projects}`, and `/api/crm/{collection}/{id}`. Production lead creation persists to MongoDB; other production create, update, and delete operations are intentionally disabled. Local development API routes retain MongoDB CRUD support.

## Security and production status

The public demo requires no account. Its CRM records are publicly readable and must contain only data suitable for public display. CRM write endpoints are disabled in production. This is suitable for demonstration, not for handling private customer data or accepting public user submissions.

Settings, team role selections, notification preferences, and display preferences remain page-local controls because there is no authenticated workspace/user model to scope them to. AI generation, summarization, and notification delivery are not connected.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
