"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, BarChart3, Bell, BriefcaseBusiness, Building2, ChevronDown, ContactRound,
  Home, Layers3, Menu, MessageSquareText, Search, Settings2, Sparkles, UsersRound, X,
} from "lucide-react";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar } from "@/components/shared/ui";
import { RouteFallback } from "@/components/shared/route-fallback";
import { companyName, leadCompanyName } from "@/lib/format";

const groups = [
  { label: "Workspace", items: [{ label: "Dashboard", href: "/dashboard", icon: Home }] },
  { label: "Relationships", items: [
    { label: "Leads", href: "/leads", icon: Sparkles },
    { label: "Contacts", href: "/contacts", icon: ContactRound },
    { label: "Companies", href: "/companies", icon: Building2 },
    { label: "Deals", href: "/deals", icon: BriefcaseBusiness },
  ] },
  { label: "Delivery", items: [
    { label: "Activities", href: "/activities", icon: Activity },
    { label: "Projects", href: "/projects", icon: Layers3 },
  ] },
  { label: "Intelligence", items: [
    { label: "Reports", href: "/reports", icon: BarChart3 },
    { label: "AI assistant", href: "/ai-assistant", icon: MessageSquareText },
  ] },
];

type SearchResult = { name: string; hint: string; href: string };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, loading, saving, error, retry } = useDemoStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menu, setMenu] = useState<"profile" | "notifications" | null>(null);
  const [today, setToday] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const results = useMemo<SearchResult[]>(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return [
      ...data.leads.map((record) => ({ name: record.name, hint: `Lead · ${leadCompanyName(data, record)}`, href: `/leads/${record.id}` })),
      ...data.contacts.map((record) => ({ name: record.name, hint: `Contact · ${companyName(data, record.companyId)}`, href: `/contacts/${record.id}` })),
      ...data.companies.map((record) => ({ name: record.name, hint: `Company · ${record.industry}`, href: `/companies/${record.id}` })),
      ...data.deals.map((record) => ({ name: record.title, hint: `Deal · ${companyName(data, record.companyId)}`, href: `/deals/${record.id}` })),
      ...data.projects.map((record) => ({ name: record.name, hint: `Project · ${companyName(data, record.companyId)}`, href: `/projects/${record.id}` })),
    ].filter((result) => `${result.name} ${result.hint}`.toLowerCase().includes(query)).slice(0, 6);
  }, [data, search]);

  const activeLabel = groups.flatMap((group) => group.items).find((item) => pathname.startsWith(item.href))?.label ?? "Dashboard";
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToday(new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date()));
    }, 0);

    function openSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        searchInput.current?.focus();
      }
    }
    window.addEventListener("keydown", openSearch);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", openSearch);
    };
  }, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (results[0]) {
      router.push(results[0].href);
      setSearch("");
      setSearchOpen(false);
    }
  }

  function navigation() {
    return <>
      <Link href="/dashboard" className="brand" onClick={() => setDrawerOpen(false)}>
        <span className="brand-mark">n</span><span><strong>nexus</strong><small>AGENCY CRM</small></span>
      </Link>
      <div className="workspace-switch"><span className="workspace-dot">N</span><span><strong>Northstar Agency</strong><small>Demo workspace</small></span><ChevronDown size={15} /></div>
      <nav className="side-nav" aria-label="Main navigation">
        {groups.map((group) => <div className="nav-group" key={group.label}>
          <p className="nav-group-label">{group.label}</p>
          {group.items.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setDrawerOpen(false)} className={`nav-link ${pathname.startsWith(href) ? "active" : ""}`} aria-current={pathname.startsWith(href) ? "page" : undefined}>
            <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
            {label === "Activities" && !loading && data.activities.filter((item) => item.status === "Overdue").length > 0 && <span className="nav-count">{data.activities.filter((item) => item.status === "Overdue").length}</span>}
          </Link>)}
        </div>)}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/settings" onClick={() => setDrawerOpen(false)} className={`nav-link ${pathname.startsWith("/settings") ? "active" : ""}`}><Settings2 size={17} /><span>Settings</span></Link>
        <div className="sidebar-help"><div className="help-icon"><UsersRound size={16} /></div><strong>Built for agency teams</strong><p>Keep every client conversation moving.</p><span className="demo-pill">Demo data</span></div>
        <button className="sidebar-profile" onClick={() => setMenu(menu === "profile" ? null : "profile")} aria-expanded={menu === "profile"}>
          <Avatar initials="MC" color="#c4e7d1" /><span><strong>Maya Chen</strong><small>Workspace owner · demo</small></span><ChevronDown size={15} />
        </button>
      </div>
    </>;
  }

  return <div className="app-frame">
    {drawerOpen && <button className="drawer-backdrop" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />}
    <aside className={`sidebar ${drawerOpen ? "drawer-open" : ""}`}>
      <button className="drawer-close icon-button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation"><X size={18} /></button>
      {navigation()}
    </aside>
    <div className="workspace-area">
      <header className="topbar">
        <div className="topbar-left"><button className="mobile-menu icon-button" onClick={() => setDrawerOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeLabel}</strong></div></div>
        <div className="topbar-tools">
          <span className="today-label">{today}</span>
          <form className={`global-search ${searchOpen ? "is-open" : ""}`} onSubmit={submitSearch} role="search">
            <Search size={16} /><input ref={searchInput} value={search} onFocus={() => setSearchOpen(true)} onChange={(event) => setSearch(event.target.value)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 160)} placeholder="Search anything..." aria-label="Search records" />
            <kbd>Ctrl K</kbd>
            {searchOpen && search.trim() && <div className="search-results" role="listbox" aria-label="Search results">{results.length ? results.map((result) => <Link role="option" aria-selected="false" key={result.href} href={result.href} onMouseDown={() => { setSearch(""); setSearchOpen(false); }}><span className="search-result-icon"><Search size={14} /></span><span><strong>{result.name}</strong><small>{result.hint}</small></span></Link>) : <p className="search-empty">No matching records</p>}</div>}
          </form>
          <div className="topbar-menu-wrap">
            <button className={`icon-button notification-button ${menu === "notifications" ? "is-active" : ""}`} aria-label="Notifications" aria-expanded={menu === "notifications"} onClick={() => setMenu(menu === "notifications" ? null : "notifications")}><Bell size={18} /><span className="notification-dot" /></button>
            {menu === "notifications" && <div className="popover notification-popover"><div className="popover-heading"><strong>Follow-ups to review</strong><Link href="/activities" onClick={() => setMenu(null)}>View all</Link></div>{data.activities.filter((item) => item.status === "Overdue").slice(0, 3).map((item) => <Link href="/activities" key={item.id} className="notification-item" onClick={() => setMenu(null)}><span className="notification-alert" /><span><strong>{item.title}</strong><small>{item.dueAt.slice(0, 10)} · overdue</small></span></Link>)}{!data.activities.some((item) => item.status === "Overdue") && <p className="popover-empty">You’re all caught up.</p>}</div>}
          </div>
          <button className="topbar-avatar" aria-label="Open profile menu" aria-expanded={menu === "profile"} onClick={() => setMenu(menu === "profile" ? null : "profile")}><Avatar initials="MC" color="#c4e7d1" size="small" /></button>
          {menu === "profile" && <div className="popover profile-popover"><div className="profile-menu-person"><Avatar initials="MC" color="#c4e7d1" /><span><strong>Maya Chen</strong><small>Demo workspace owner</small></span></div><Link href="/settings" onClick={() => setMenu(null)}>Workspace settings</Link><p>The public demo is read-only; changes are not saved.</p></div>}
        </div>
      </header>
      <main className="main-content">
        {error && <div className="storage-error" role="alert"><span>{error}</span><button className="button" type="button" onClick={() => void retry()}>Retry</button></div>}
        {saving && <p className="storage-saving" role="status">Saving changes to the CRM database…</p>}
        {loading && <RouteFallback />}
        {children}
      </main>
      <footer className="app-footer"><span>Nexus CRM <span className="footer-dot">·</span> Demo workspace</span><span>MongoDB storage · Demo identity</span></footer>
    </div>
  </div>;
}