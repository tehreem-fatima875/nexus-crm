# Nexus CRM

A frontend-only CRM workspace for web development and digital marketing agencies. The interface is built with the Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, and Recharts.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. The root route redirects to `/dashboard`.

## Routes

- `/dashboard` — sample agency overview and analytics
- `/leads` and `/leads/[id]` — lead directory and lead records
- `/contacts` and `/contacts/[id]` — contact directory and profiles
- `/companies` and `/companies/[id]` — company directory and account profiles
- `/deals` and `/deals/[id]` — sales pipeline and deal records
- `/activities` — tasks, calls, meetings, notes, and follow-ups
- `/projects` and `/projects/[id]` — client delivery projects
- `/reports` — sample analytics and deal CSV export
- `/ai-assistant` — planned AI workflows and editable user-authored drafts
- `/settings` — demo workspace, team, roles, notification, display, and AI settings

## Demo data and backend boundary

All CRM records and analytics are typed sample data in `src/data`. The shared client-side demo store supports in-session create/edit actions, stage changes, task completion and rescheduling, project deliverables, and local preference controls. Data resets on a full page refresh; nothing is sent to a server or persisted to a database.

Authentication, authorization, API routes, MongoDB, notification delivery, and AI-provider calls are not implemented. Team roles are informational only. AI generation and summarisation stay unavailable until a protected server integration and data-handling policy are added. No credentials or external service connections are included.

## Checks

```bash
npm run lint
npm run build
```
