# Nexus CRM

A CRM workspace for web development and digital marketing agencies, built with the Next.js App Router, TypeScript, Tailwind CSS, Lucide icons, Recharts, and the MongoDB Node.js driver.

## Local setup

1. Install dependencies with `npm install`.
2. Create a root `.env.local` file containing the MongoDB Atlas connection string:

   ```env
   MONGODB_URI=your-mongodb-atlas-connection-string
   ```

   The application always uses the `nexus_crm` database. Configure the Atlas database user with access only to that database. Keep `.env.local` private and never expose the URI to browser code.
3. Start the development server bound to loopback with `npm run dev -- --hostname 127.0.0.1` and open `http://127.0.0.1:3000/login`.
4. Sign in with the local demo account. The username defaults to `demo` and is shown in the login form; set `DEMO_USERNAME` in `.env.local` to use a different username. To set or reset the local password without echoing it in the terminal, run `npm run auth:reset-password`, enter a new password twice at the hidden prompts, and restart the development server. The reset command changes only `DEMO_PASSWORD` in the root `.env.local`; that file is git-ignored. For an exposed deployment, set server-side `DEMO_USERNAME`, `DEMO_PASSWORD` (at least 12 characters), and `DEMO_AUTH_SECRET` (at least 32 characters) before starting the production server. Never use the development defaults outside a loopback-only local demo.

The login is a shared demo identity. Development defaults are provided only to make a loopback demo easy to run; production does not fall back to these values and requires all three authentication environment variables.

The development-only `GET /api/db-test` endpoint checks connectivity without returning credentials. CRM collections and indexes are created as needed; initial sample CRM records are not copied into MongoDB. The MongoDB driver uses its standard TLS defaults, bounded connection/server-selection timeouts, connection pooling, and retryable reads/writes. Intermittent Atlas reachability can still depend on network access, DNS, and Atlas availability.

## CRM routes

- `/dashboard` — overview and analytics calculated from stored CRM records; the historical revenue chart remains illustrative.
- `/leads` and `/leads/[id]` — lead directory and lead records
- `/contacts` and `/contacts/[id]` — contact directory and profiles
- `/companies` and `/companies/[id]` — company directory and account profiles
- `/deals` and `/deals/[id]` — sales pipeline and deal records
- `/activities` — tasks, calls, meetings, notes, and follow-ups
- `/projects` and `/projects/[id]` — client delivery projects
- `/reports` — analytics and deal CSV export
- `/ai-assistant` — planned AI workflows and editable user-authored drafts; no AI provider is connected
- `/settings` — local demo preferences and informational team/role settings

The CRM API provides list/create endpoints at `/api/crm/{leads,contacts,companies,deals,activities,projects}` and read/update/delete endpoints at `/api/crm/{collection}/{id}`. Request data is validated on the server, relationship references are checked, and deletion is rejected when another CRM record depends on the target.

The existing sample owner list remains a fixed demo directory; the demo login is a single shared identity, not user/team management. CRM records are stored in MongoDB and remain after refresh. A fresh database starts with empty CRM collections; add companies first, then create contacts and deals that reference them. Leads can store a typed company name without making a company record; a matching existing company is linked.

## Security and production status

The demo has a shared username/password login, an eight-hour signed HttpOnly session cookie, and Next.js Proxy checks on application pages and APIs. It has no user accounts, password reset/MFA, rate limiting, role-based permissions, or tenant isolation. All signed-in demo users share the same `nexus_crm` data. This is a demonstration gate, not production-grade account security; do not use it for real customer data or treat it as a multi-tenant system.

Settings, team role selections, notification preferences, and display preferences remain page-local demo controls because there is no authenticated workspace/user model to scope them to. AI generation, summarization, and notification delivery are not connected.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```
