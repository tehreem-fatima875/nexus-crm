"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity as ActivityIcon, ArrowRight, CalendarDays, Check, ChevronDown, CircleCheck, Clock3, Filter, List, Plus, Search, Trash2 } from "lucide-react";
import { RecordForm, type FormField } from "@/components/shared/record-form";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar, Badge, Card, PageTitle, SectionHeading } from "@/components/shared/ui";
import { getDealFields, getProjectFields } from "@/features/records/record-detail";
import { companyName, contactName, currency, dateLabel, ownerName, relativeDate, shortDate } from "@/lib/format";
import type { Activity as ActivityRecord, ActivityStatus, ActivityType, Deal, DealStage, Project, ProjectStatus } from "@/types/crm";

const dealStages: DealStage[] = ["New Opportunity", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const projectStatuses: ProjectStatus[] = ["Planning", "In Progress", "Review", "Completed", "On Hold"];

function dealStageTone(stage: DealStage) {
  return stage === "Won" ? "Won" : stage === "Lost" ? "Lost" : stage;
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DealsWorkspace({ initialCreate = false }: { initialCreate?: boolean }) {
  const { data, setData } = useDemoStore();
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("All stages");
  const [owner, setOwner] = useState("All owners");
  const [period, setPeriod] = useState("Any close date");
  const [formOpen, setFormOpen] = useState(initialCreate);
  const fields = getDealFields(data);
  const openDeals = data.deals.filter((deal) => !["Won", "Lost"].includes(deal.stage));
  const wonDeals = data.deals.filter((deal) => deal.stage === "Won");
  const lostDeals = data.deals.filter((deal) => deal.stage === "Lost");
  const visibleDeals = useMemo(() => data.deals.filter((deal) => {
    const term = query.trim().toLowerCase();
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const daysUntilClose = (new Date(`${deal.closeDate}T12:00:00`).getTime() - today.getTime()) / 86_400_000;
    const withinPeriod = period === "Any close date" || (period === "Next 30 days" ? daysUntilClose >= 0 && daysUntilClose <= 30 : daysUntilClose >= 0 && daysUntilClose <= 90);
    return (!term || `${deal.title} ${companyName(data, deal.companyId)}`.toLowerCase().includes(term))
      && (stage === "All stages" || deal.stage === stage)
      && (owner === "All owners" || ownerName(data, deal.ownerId) === owner)
      && withinPeriod;
  }), [data, owner, period, query, stage]);

  function createDeal(values: Record<string, string>) {
    const record: Deal = {
      id: `dl${Date.now().toString(36)}`, title: values.title,
      companyId: data.companies.find((item) => item.name === values.companyName)?.id ?? data.companies[0]?.id ?? "",
      contactId: data.contacts.find((item) => item.name === values.contactName)?.id ?? data.contacts[0]?.id ?? "",
      value: Number(values.value), currency: "USD", stage: values.stage as DealStage,
      ownerId: data.owners.find((item) => item.name === values.ownerName)?.id ?? data.owners[0]?.id ?? "",
      closeDate: values.closeDate, service: values.service, notes: values.notes ?? "",
    };
    setData((current) => ({ ...current, deals: [record, ...current.deals] }));
    setFormOpen(false);
  }

  function changeStage(id: string, nextStage: DealStage) {
    setData((current) => ({ ...current, deals: current.deals.map((deal) => deal.id === id ? { ...deal, stage: nextStage } : deal) }));
  }

  const columns = stage === "All stages" ? dealStages : [stage as DealStage];
  return <div className="page-content">
    <PageTitle eyebrow="Sales" title="Deals" description="Move opportunities forward and keep open pipeline separate from closed revenue. Deal amounts are in USD." actions={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={14} />Create deal</button>} />
    <div className="deal-summary"><div className="deal-summary-item"><small>Open pipeline</small><strong>{currency(openDeals.reduce((sum, deal) => sum + deal.value, 0))}</strong></div><div className="deal-summary-item"><small>Closed-won revenue</small><strong>{currency(wonDeals.reduce((sum, deal) => sum + deal.value, 0))}</strong></div><div className="deal-summary-item"><small>Closed-lost value</small><strong>{currency(lostDeals.reduce((sum, deal) => sum + deal.value, 0))}</strong></div></div>
    <section className="panel"><div className="table-toolbar"><label className="search-control"><Search size={14} /><input className="input-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deal or company..." aria-label="Search deals" /></label><label className="filter-control"><span className="sr-only">Filter by stage</span><select className="select-control" value={stage} onChange={(event) => setStage(event.target.value)}><option>All stages</option>{dealStages.map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-control"><span className="sr-only">Filter by owner</span><select className="select-control" value={owner} onChange={(event) => setOwner(event.target.value)}><option>All owners</option>{data.owners.map((item) => <option key={item.id}>{item.name}</option>)}</select></label><label className="filter-control"><span className="sr-only">Filter by close period</span><select className="select-control" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Any close date</option><option>Next 30 days</option><option>Next 90 days</option></select></label></div>
      <div className="kanban-board">{columns.map((column) => {
        const deals = visibleDeals.filter((deal) => deal.stage === column);
        const columnValue = deals.reduce((sum, deal) => sum + deal.value, 0);
        return <section className="kanban-column" key={column} aria-label={`${column} deals`}><div className="kanban-column-header"><strong>{column}</strong><span>{deals.length}</span></div><small className="column-total">{currency(columnValue)}</small>{deals.map((deal) => <article className="deal-card" key={deal.id}><Link className="deal-card-title" href={`/deals/${deal.id}`}>{deal.title}</Link><Link className="deal-card-company" href={`/companies/${deal.companyId}`}>{companyName(data, deal.companyId)}</Link><div className="deal-card-value">{currency(deal.value, deal.currency)}</div><div className="deal-card-footer"><span className="table-person"><Avatar initials={data.owners.find((item) => item.id === deal.ownerId)?.initials ?? "--"} color={data.owners.find((item) => item.id === deal.ownerId)?.color} size="small" />{ownerName(data, deal.ownerId)}</span><span>{shortDate(deal.closeDate)}</span></div><label className="sr-only" htmlFor={`deal-stage-${deal.id}`}>Change stage for {deal.title}</label><select id={`deal-stage-${deal.id}`} className="board-select" value={deal.stage} onChange={(event) => changeStage(deal.id, event.target.value as DealStage)}>{dealStages.map((item) => <option key={item}>{item}</option>)}</select></article>)}{deals.length === 0 && <p className="column-empty">No matching deals</p>}</section>;
      })}</div>
      <div className="kanban-footer"><span>{visibleDeals.length} of {data.deals.length} deals</span><span>Change stages using each card’s accessible selector.</span></div>
    </section>
    {formOpen && <RecordForm title="Create deal" description="Add an opportunity to the agency pipeline." fields={fields} initialValues={{ currency: "USD" }} submitLabel="Create deal" onClose={() => setFormOpen(false)} onSubmit={createDeal} />}
  </div>;
}

const activityTypes: ActivityType[] = ["Task", "Call", "Meeting", "Note", "Follow-up"];
const activityStatuses: ActivityStatus[] = ["Upcoming", "Completed", "Overdue"];

function getActivityFields(data: ReturnType<typeof useDemoStore>["data"]): FormField[] {
  const relatedOptions = [
    ...data.leads.map((item) => `Lead: ${item.name}`),
    ...data.contacts.map((item) => `Contact: ${item.name}`),
    ...data.companies.map((item) => `Company: ${item.name}`),
    ...data.deals.map((item) => `Deal: ${item.title}`),
    ...data.projects.map((item) => `Project: ${item.name}`),
  ];
  return [
    { name: "title", label: "Activity title", required: true },
    { name: "type", label: "Type", type: "select", required: true, options: activityTypes },
    { name: "dueDate", label: "Due date", type: "date", required: true },
    { name: "priority", label: "Priority", type: "select", required: true, options: ["Low", "Medium", "High"] },
    { name: "ownerName", label: "Assignee", type: "select", required: true, options: data.owners.map((item) => item.name) },
    { name: "status", label: "Status", type: "select", required: true, options: activityStatuses },
    { name: "related", label: "Related record", type: "select", required: true, options: relatedOptions },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
}

function activityHref(activity: ActivityRecord) {
  const routes: Record<ActivityRecord["relatedType"], string> = {
    Lead: "leads", Contact: "contacts", Company: "companies", Deal: "deals", Project: "projects",
  };
  return `/${routes[activity.relatedType]}/${activity.relatedId}`;
}

function activityLabel(activity: ActivityRecord, data: ReturnType<typeof useDemoStore>["data"]) {
  if (activity.relatedType === "Lead") return data.leads.find((item) => item.id === activity.relatedId)?.name ?? "Lead";
  if (activity.relatedType === "Contact") return data.contacts.find((item) => item.id === activity.relatedId)?.name ?? "Contact";
  if (activity.relatedType === "Company") return companyName(data, activity.relatedId);
  if (activity.relatedType === "Deal") return data.deals.find((item) => item.id === activity.relatedId)?.title ?? "Deal";
  return data.projects.find((item) => item.id === activity.relatedId)?.name ?? "Project";
}

export function ActivitiesWorkspace({ initialCreate = false }: { initialCreate?: boolean }) {
  const { data, setData, deleteRecord } = useDemoStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All activities");
  const [type, setType] = useState("All types");
  const [view, setView] = useState<"list" | "calendar">("list");
  const [formOpen, setFormOpen] = useState(initialCreate);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const fields = getActivityFields(data);
  const visible = useMemo(() => data.activities.filter((item) => {
    const term = query.trim().toLowerCase();
    return (!term || `${item.title} ${item.notes} ${activityLabel(item, data)}`.toLowerCase().includes(term))
      && (filter === "All activities" || item.status === filter)
      && (type === "All types" || item.type === type);
  }).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [data, filter, query, type]);
  const overdueCount = data.activities.filter((item) => item.status === "Overdue").length;

  function complete(id: string) {
    setData((current) => ({ ...current, activities: current.activities.map((item) => item.id === id ? { ...item, status: "Completed" } : item) }));
  }

  function reschedule(id: string, dueDate: string) {
    if (!dueDate) return;
    setData((current) => ({ ...current, activities: current.activities.map((item) => item.id === id ? { ...item, dueAt: `${dueDate}T12:00:00`, status: "Upcoming" } : item) }));
    setRescheduleId(null);
  }

  function removeActivity(id: string, title: string) {
    if (window.confirm(`Delete activity "${title}"? This cannot be undone.`)) {
      void deleteRecord("activities", id);
    }
  }

  function createActivity(values: Record<string, string>) {
    const [relatedType, relatedName] = (values.related ?? "Lead: ").split(": ");
    const relatedRecord = relatedType === "Lead" ? data.leads.find((item) => item.name === relatedName)
      : relatedType === "Contact" ? data.contacts.find((item) => item.name === relatedName)
        : relatedType === "Company" ? data.companies.find((item) => item.name === relatedName)
          : relatedType === "Deal" ? data.deals.find((item) => item.title === relatedName)
            : data.projects.find((item) => item.name === relatedName);
    const record: ActivityRecord = {
      id: `ac${Date.now().toString(36)}`, title: values.title, type: values.type as ActivityType,
      dueAt: `${values.dueDate}T12:00:00`, priority: values.priority as ActivityRecord["priority"],
      ownerId: data.owners.find((item) => item.name === values.ownerName)?.id ?? data.owners[0]?.id ?? "",
      relatedType: (relatedRecord ? relatedType : "Lead") as ActivityRecord["relatedType"], relatedId: relatedRecord?.id ?? data.leads[0]?.id ?? "",
      status: values.status as ActivityStatus, notes: values.notes ?? "",
    };
    setData((current) => ({ ...current, activities: [record, ...current.activities] }));
    setFormOpen(false);
  }

  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = localDateKey(today);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() + index);
    return localDateKey(date);
  });

  return <div className="page-content"><PageTitle eyebrow="Delivery" title="Activities" description="Tasks, calls, meetings, notes, and follow-ups across your sample client relationships." actions={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={14} />Add activity</button>} />
    <div className="activity-summary"><Card><span className="activity-summary-icon"><Clock3 size={16} /></span><span><small>Overdue</small><strong>{overdueCount}</strong></span></Card><Card><span className="activity-summary-icon"><CalendarDays size={16} /></span><span><small>Upcoming</small><strong>{data.activities.filter((item) => item.status === "Upcoming").length}</strong></span></Card><Card><span className="activity-summary-icon"><CircleCheck size={16} /></span><span><small>Completed</small><strong>{data.activities.filter((item) => item.status === "Completed").length}</strong></span></Card></div>
    <section className="panel"><div className="table-toolbar"><label className="search-control"><Search size={14} /><input className="input-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activities or records..." aria-label="Search activities" /></label><label className="filter-control"><span className="sr-only">Filter activity status</span><select className="select-control" value={filter} onChange={(event) => setFilter(event.target.value)}><option>All activities</option>{activityStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-control"><span className="sr-only">Filter activity type</span><select className="select-control" value={type} onChange={(event) => setType(event.target.value)}><option>All types</option>{activityTypes.map((item) => <option key={item}>{item}</option>)}</select></label><div className="segmented-control" role="group" aria-label="Activity view"><button className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-pressed={view === "list"}><List size={13} />List</button><button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")} aria-pressed={view === "calendar"}><CalendarDays size={13} />Week</button></div></div>
      {view === "list" ? <div className="activity-table-wrap"><table className="data-table"><thead><tr><th>Activity</th><th>Type</th><th>Due</th><th>Priority</th><th>Assignee</th><th>Related record</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><span className="table-primary">{item.title}</span><div className="table-secondary">{item.notes}</div></td><td><span className="type-label"><ActivityIcon size={12} />{item.type}</span></td><td>{shortDate(item.dueAt)}<div className={`table-secondary ${item.status === "Overdue" ? "text-overdue" : ""}`}>{item.status === "Completed" ? "Done" : relativeDate(item.dueAt)}</div></td><td><Badge tone={item.priority}>{item.priority}</Badge></td><td>{ownerName(data, item.ownerId)}</td><td><Link className="text-link" href={activityHref(item)}>{activityLabel(item, data)}</Link></td><td><Badge tone={item.status}>{item.status}</Badge></td><td><div className="row-actions">{item.status !== "Completed" && <button className="icon-button row-action-button" title="Mark complete" aria-label={`Mark ${item.title} complete`} onClick={() => complete(item.id)}><Check size={14} /></button>}{item.status !== "Completed" && <button className="button button-quiet reschedule-toggle" onClick={() => setRescheduleId(rescheduleId === item.id ? null : item.id)}>Reschedule</button>}<button className="icon-button row-action-button" title="Delete activity" aria-label={`Delete ${item.title}`} onClick={() => removeActivity(item.id, item.title)}><Trash2 size={14} /></button></div>{rescheduleId === item.id && <input className="reschedule-input" type="date" min={todayKey} aria-label={`New due date for ${item.title}`} defaultValue={item.dueAt.slice(0, 10)} onChange={(event) => reschedule(item.id, event.target.value)} />}</td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-state"><span className="empty-mark"><Search size={15} /></span><h3>No activities match</h3><p>Try a different filter or schedule a new follow-up.</p></div>}</div>
        : <div className="week-grid">{week.map((day) => { const dayItems = visible.filter((item) => item.dueAt.slice(0, 10) === day); return <div className={`week-day ${day === todayKey ? "is-today" : ""}`} key={day}><div className="week-day-heading"><strong>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${day}T12:00:00`))}</strong><span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${day}T12:00:00`))}</span></div>{dayItems.map((item) => <Link href={activityHref(item)} className={`calendar-activity ${item.status.toLowerCase()}`} key={item.id}><strong>{item.title}</strong><small>{item.type} · {item.dueAt.slice(11, 16) || "All day"}</small></Link>)}{!dayItems.length && <span className="calendar-empty">No activity</span>}</div>; })}</div>}
      <div className="table-footer"><span>{visible.length} activities shown</span><span>Completed items remain in history.</span></div>
    </section>
    {formOpen && <RecordForm title="Add activity" description="Log a follow-up in this demo workspace." fields={fields} submitLabel="Create activity" onClose={() => setFormOpen(false)} onSubmit={createActivity} />}
  </div>;
}

export function ProjectsWorkspace({ initialCreate = false }: { initialCreate?: boolean }) {
  const { data, setData } = useDemoStore();
  const [status, setStatus] = useState("All statuses");
  const [owner, setOwner] = useState("All owners");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(initialCreate);
  const fields = getProjectFields(data);
  const projects = data.projects.filter((project) => (!query || `${project.name} ${companyName(data, project.companyId)}`.toLowerCase().includes(query.toLowerCase()))
    && (status === "All statuses" || project.status === status)
    && (owner === "All owners" || ownerName(data, project.ownerId) === owner));

  function createProject(values: Record<string, string>) {
    const project: Project = {
      id: `pr${Date.now().toString(36)}`, name: values.name,
      companyId: data.companies.find((item) => item.name === values.companyName)?.id ?? data.companies[0]?.id ?? "",
      dealId: data.deals.find((item) => item.title === values.dealTitle)?.id ?? data.deals[0]?.id ?? "",
      ownerId: data.owners.find((item) => item.name === values.ownerName)?.id ?? data.owners[0]?.id ?? "",
      status: values.status as ProjectStatus, priority: values.priority as Project["priority"], startDate: values.startDate, deadline: values.deadline,
      deliverables: ["Discovery and kickoff", "Design and review", "Build and delivery"].map((title, index) => ({ id: `${Date.now()}-${index}`, title, done: false })),
    };
    setData((current) => ({ ...current, projects: [project, ...current.projects] }));
    setFormOpen(false);
  }

  function progress(project: Project) {
    return project.deliverables.length ? Math.round(project.deliverables.filter((item) => item.done).length / project.deliverables.length * 100) : 0;
  }

  return <div className="page-content"><PageTitle eyebrow="Delivery" title="Projects" description="Client delivery, deadlines, and milestone progress in one workspace." actions={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={14} />Create project</button>} />
    <div className="project-summary"><div><small>In progress</small><strong>{data.projects.filter((item) => item.status === "In Progress").length}</strong></div><div><small>In review</small><strong>{data.projects.filter((item) => item.status === "Review").length}</strong></div><div><small>Deliverables complete</small><strong>{data.projects.reduce((sum, item) => sum + item.deliverables.filter((deliverable) => deliverable.done).length, 0)} <span>/ {data.projects.reduce((sum, item) => sum + item.deliverables.length, 0)}</span></strong></div><div><small>On hold</small><strong>{data.projects.filter((item) => item.status === "On Hold").length}</strong></div></div>
    <div className="table-toolbar"><label className="search-control"><Search size={14} /><input className="input-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project or client..." aria-label="Search projects" /></label><label className="filter-control"><span className="sr-only">Filter project status</span><select className="select-control" value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{projectStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-control"><span className="sr-only">Filter project owner</span><select className="select-control" value={owner} onChange={(event) => setOwner(event.target.value)}><option>All owners</option>{data.owners.map((item) => <option key={item.id}>{item.name}</option>)}</select></label></div>
    {projects.length ? <div className="project-grid">{projects.map((project) => { const projectOwner = data.owners.find((item) => item.id === project.ownerId); return <article className="project-card" key={project.id}><div className="project-card-top"><div><h3><Link href={`/projects/${project.id}`}>{project.name}</Link></h3><Link className="project-card-company" href={`/companies/${project.companyId}`}>{companyName(data, project.companyId)}</Link></div><Badge tone={project.status}>{project.status}</Badge></div><div className="project-card-meta"><Badge tone={project.priority}>{project.priority} priority</Badge><Badge>{data.deals.find((item) => item.id === project.dealId)?.service ?? "Client delivery"}</Badge></div><div className="progress-copy"><span>{project.deliverables.filter((item) => item.done).length} of {project.deliverables.length} deliverables</span><strong>{progress(project)}%</strong></div><div className="progress-track"><span style={{ width: `${progress(project)}%` }} /></div><div className="project-card-footer"><span className="table-person"><Avatar initials={projectOwner?.initials ?? "--"} color={projectOwner?.color} size="small" />{ownerName(data, project.ownerId)}</span><span>Due {dateLabel(project.deadline, { month: "short", day: "numeric" })}</span></div><Link className="project-open-link" href={`/projects/${project.id}`}>View project <ArrowRight size={12} /></Link></article>; })}</div> : <section className="panel"><div className="empty-state"><span className="empty-mark">N</span><h3>No projects match</h3><p>Try another filter or create a project.</p></div></section>}
    <p className="field-hint">Project changes are saved to the CRM database.</p>
    {formOpen && <RecordForm title="Create project" description="Start a sample client delivery project." fields={fields} submitLabel="Create project" onClose={() => setFormOpen(false)} onSubmit={createProject} />}
  </div>;
}