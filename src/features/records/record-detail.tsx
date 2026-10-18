"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, CircleDot, Clock3, ExternalLink, Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from "lucide-react";
import { RecordForm, type FormField } from "@/components/shared/record-form";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar, Badge, Card, PageTitle, SectionHeading } from "@/components/shared/ui";
import { getRecordFields, type RecordKind } from "@/features/records/record-workspace";
import { companyName, contactName, currency, dateLabel, ownerName, relativeDate, shortDate } from "@/lib/format";
import type { Activity, Company, Contact, Deal, DealStage, Lead, Project, ProjectStatus } from "@/types/crm";

export type DetailKind = RecordKind | "deals" | "projects";

const dealStages: DealStage[] = ["New Opportunity", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
const projectStatuses: ProjectStatus[] = ["Planning", "In Progress", "Review", "Completed", "On Hold"];

export function getDealFields(data: ReturnType<typeof useDemoStore>["data"]): FormField[] {
  return [
    { name: "title", label: "Deal name", required: true },
    { name: "companyName", label: "Company", type: "select", required: true, options: data.companies.map((item) => item.name) },
    { name: "contactName", label: "Primary contact", type: "select", required: true, options: data.contacts.map((item) => item.name) },
    { name: "value", label: "Value (USD)", type: "number", required: true },
    { name: "stage", label: "Stage", type: "select", required: true, options: dealStages },
    { name: "ownerName", label: "Owner", type: "select", required: true, options: data.owners.map((item) => item.name) },
    { name: "closeDate", label: "Expected close", type: "date", required: true },
    { name: "service", label: "Service", required: true },
    { name: "notes", label: "Deal notes", type: "textarea", wide: true },
  ];
}

export function getProjectFields(data: ReturnType<typeof useDemoStore>["data"]): FormField[] {
  return [
    { name: "name", label: "Project name", required: true },
    { name: "companyName", label: "Client company", type: "select", required: true, options: data.companies.map((item) => item.name) },
    { name: "dealTitle", label: "Linked deal", type: "select", options: data.deals.map((item) => item.title) },
    { name: "ownerName", label: "Project owner", type: "select", required: true, options: data.owners.map((item) => item.name) },
    { name: "status", label: "Status", type: "select", required: true, options: projectStatuses },
    { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] },
    { name: "startDate", label: "Start date", type: "date", required: true },
    { name: "deadline", label: "Deadline", type: "date", required: true },
  ];
}

function DetailBack({ href, label }: { href: string; label: string }) {
  return <Link className="text-link" href={href}><ArrowLeft size={13} />Back to {label}</Link>;
}

function ActivityTimeline({ activities }: { activities: Activity[] }) {
  if (!activities.length) return <p className="page-description">No activity recorded yet.</p>;
  return <div className="timeline">{activities.map((item) => <div className="timeline-item" key={item.id}><span className="timeline-dot" /><div className="timeline-copy"><strong>{item.title}</strong><p>{item.notes || item.type}</p><small>{item.type} · {dateLabel(item.dueAt, { month: "short", day: "numeric", year: "numeric" })} · {ownerNameFromActivity(item)}</small></div></div>)}</div>;
}

function ownerNameFromActivity(item: Activity) {
  return item.status === "Completed" ? "Completed" : item.status;
}

function NotFoundRecord({ kind }: { kind: string }) {
  return <Card className="not-found-card"><span className="empty-mark">N</span><h1>Record not found</h1><p>This sample {kind} may have been removed or does not exist in this demo workspace.</p><Link className="button button-primary" href={`/${kind}`}><ArrowLeft size={14} />Back to {kind}</Link></Card>;
}

function LeadDetail({ id }: { id: string }) {
  const { data, setData } = useDemoStore();
  const lead = data.leads.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  if (!lead) return <NotFoundRecord kind="leads" />;
  const originalCompanyId = lead.companyId;
  const originalOwnerId = lead.ownerId;
  const fields = getRecordFields("leads", data.companies.map((item) => item.name), data.owners.map((item) => item.name));
  const initialValues = { ...lead, companyName: companyName(data, lead.companyId), ownerName: ownerName(data, lead.ownerId) } as unknown as Record<string, string>;
  const activities = data.activities.filter((item) => item.relatedType === "Lead" && item.relatedId === id);
  const nextAction = activities.find((item) => item.status !== "Completed");

  function save(values: Record<string, string>) {
    const companyId = data.companies.find((item) => item.name === values.companyName)?.id ?? originalCompanyId;
    const ownerId = data.owners.find((item) => item.name === values.ownerName)?.id ?? originalOwnerId;
    setData((current) => ({ ...current, leads: current.leads.map((item) => item.id === id ? { ...item, name: values.name, email: values.email, phone: values.phone, companyId, ownerId, service: values.service, source: values.source, status: values.status as Lead["status"], budget: values.budget, requirements: values.requirements } : item) }));
    setEditing(false);
  }

  function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!note.trim()) return;
    setData((current) => ({ ...current, leads: current.leads.map((item) => item.id === id ? { ...item, notes: [`${note.trim()} · ${shortDate(new Date().toISOString())}`, ...item.notes] } : item) }));
    setNote("");
  }

  return <div className="page-content">
    <DetailBack href="/leads" label="leads" />
    <PageTitle eyebrow="Lead record" title={lead.name} description={`${companyName(data, lead.companyId)} · ${lead.service}`} actions={<button className="button" onClick={() => setEditing(true)}><Pencil size={13} />Edit lead</button>} />
    <div className="record-layout"><div className="record-main">
      <Card><div className="record-hero"><span className="record-hero-icon"><UserRound size={20} /></span><div className="record-hero-copy"><h1>{lead.name}</h1><p>{companyName(data, lead.companyId)} · Added {dateLabel(lead.createdAt)}</p><div className="record-meta"><Badge tone={lead.status}>{lead.status}</Badge><Badge>{lead.source}</Badge><Badge>{lead.service}</Badge></div></div></div><div className="detail-grid" style={{ marginTop: 20 }}><div className="detail-item"><small>Email</small><a href={`mailto:${lead.email}`}>{lead.email}</a></div><div className="detail-item"><small>Phone</small><a href={`tel:${lead.phone}`}>{lead.phone || "Not provided"}</a></div><div className="detail-item"><small>Company</small><Link href={`/companies/${lead.companyId}`}>{companyName(data, lead.companyId)}</Link></div><div className="detail-item"><small>Owner</small><strong>{ownerName(data, lead.ownerId)}</strong></div><div className="detail-item"><small>Budget range</small><strong>{lead.budget}</strong></div><div className="detail-item"><small>Next action</small><strong>{nextAction?.title ?? "No open follow-up"}</strong></div></div></Card>
      <Card><SectionHeading title="Requirements" /><p className="page-description" style={{ margin: 0, lineHeight: 1.7 }}>{lead.requirements || "No requirements have been added."}</p></Card>
      <Card><SectionHeading title="Activity history" detail={`${activities.length} linked activities`} /><ActivityTimeline activities={activities} /></Card>
      <Card><SectionHeading title="Notes" action={<Badge>{lead.notes.length} notes</Badge>} /><form className="note-compose" onSubmit={addNote}><textarea className="input-control" rows={2} placeholder="Add a note to this lead..." value={note} onChange={(event) => setNote(event.target.value)} aria-label="Add a note" /><button className="button button-primary" type="submit" disabled={!note.trim()}><Plus size={13} />Add note</button></form><div className="notes-list" style={{ marginTop: 12 }}>{lead.notes.map((item, index) => <div className="note-item" key={`${item}-${index}`}><p>{item}</p><small>Added to demo record</small></div>)}</div></Card>
    </div><aside className="record-aside">
      <Card><SectionHeading title="Sample lead score" detail="Illustrative factors · not predictive" /><div className="score-explanation"><div className="score-number"><strong>{lead.score}</strong><span>out of 100</span></div><div className="score-track" style={{ width: "100%", marginTop: 7 }}><span style={{ width: `${lead.score}%` }} /></div><div className="factor-row"><span>Service fit</span><span>Strong</span></div><div className="factor-row"><span>Company context</span><span>Available</span></div><div className="factor-row"><span>Budget clarity</span><span>{lead.budget === "Not shared" ? "Missing" : "Shared"}</span></div><div className="factor-row"><span>Decision timeline</span><span>Confirm</span></div></div><p className="field-hint">This score is sample data. It is not generated by a connected AI model.</p></Card>
      <Card><SectionHeading title="Next step" />{nextAction ? <><Badge tone={nextAction.status}>{nextAction.status}</Badge><p className="table-primary" style={{ margin: "9px 0 4px" }}>{nextAction.title}</p><p className="page-description">{relativeDate(nextAction.dueAt)} · {nextAction.type}</p><Link className="text-link" href="/activities">Open activities <ArrowRight size={13} /></Link></> : <Link className="button" href="/activities?create=1"><Plus size={13} />Schedule follow-up</Link>}</Card>
      <Card><SectionHeading title="Related company" /><Link className="table-link" href={`/companies/${lead.companyId}`}>{companyName(data, lead.companyId)} <ArrowRight size={12} /></Link><p className="page-description">{data.companies.find((item) => item.id === lead.companyId)?.industry}</p></Card>
    </aside></div>
    {editing && <RecordForm title="Edit lead" description="Update this sample lead record." fields={fields} initialValues={initialValues} onClose={() => setEditing(false)} onSubmit={save} />}
  </div>;
}

function ContactDetail({ id }: { id: string }) {
  const { data, setData } = useDemoStore();
  const contact = data.contacts.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!contact) return <NotFoundRecord kind="contacts" />;
  const originalCompanyId = contact.companyId;
  const originalOwnerId = contact.ownerId;
  const fields = getRecordFields("contacts", data.companies.map((item) => item.name), data.owners.map((item) => item.name));
  const initialValues = { ...contact, companyName: companyName(data, contact.companyId), ownerName: ownerName(data, contact.ownerId) } as unknown as Record<string, string>;
  const deals = data.deals.filter((item) => item.contactId === id);
  const activities = data.activities.filter((item) => item.relatedType === "Contact" && item.relatedId === id);

  function save(values: Record<string, string>) {
    const companyId = data.companies.find((item) => item.name === values.companyName)?.id ?? originalCompanyId;
    const ownerId = data.owners.find((item) => item.name === values.ownerName)?.id ?? originalOwnerId;
    setData((current) => ({ ...current, contacts: current.contacts.map((item) => item.id === id ? { ...item, name: values.name, role: values.role, email: values.email, phone: values.phone, companyId, ownerId, source: values.source, notes: values.notes } : item) }));
    setEditing(false);
  }

  return <div className="page-content"><DetailBack href="/contacts" label="contacts" /><PageTitle eyebrow="Contact profile" title={contact.name} description={`${contact.role} at ${companyName(data, contact.companyId)}`} actions={<button className="button" onClick={() => setEditing(true)}><Pencil size={13} />Edit contact</button>} />
    <div className="record-layout"><div className="record-main">
      <Card><div className="record-hero"><Avatar initials={contact.name.split(" ").map((part) => part[0]).join("")} color="#dcefe1" /><div className="record-hero-copy"><h1>{contact.name}</h1><p>{contact.role} · {companyName(data, contact.companyId)}</p><div className="record-meta"><Badge>{contact.source}</Badge><Badge>{ownerName(data, contact.ownerId)}</Badge></div></div></div><div className="detail-grid" style={{ marginTop: 20 }}><div className="detail-item"><small>Email</small><a href={`mailto:${contact.email}`}><Mail size={12} /> {contact.email}</a></div><div className="detail-item"><small>Phone</small><a href={`tel:${contact.phone}`}><Phone size={12} /> {contact.phone}</a></div><div className="detail-item"><small>Company</small><Link href={`/companies/${contact.companyId}`}>{companyName(data, contact.companyId)}</Link></div><div className="detail-item"><small>Account owner</small><strong>{ownerName(data, contact.ownerId)}</strong></div></div></Card>
      <Card><SectionHeading title="Linked deals" detail="Opportunities involving this contact" />{deals.length ? <div className="linked-record-list">{deals.map((deal) => <Link className="linked-record" key={deal.id} href={`/deals/${deal.id}`}><span><strong>{deal.title}</strong><small>{deal.service} · {dateLabel(deal.closeDate)}</small></span><span className="linked-record-end"><Badge tone={deal.stage}>{deal.stage}</Badge><strong>{currency(deal.value)}</strong></span></Link>)}</div> : <p className="page-description">No linked deals.</p>}</Card>
      <Card><SectionHeading title="Recent activity" detail={`${activities.length} linked activity records`} /><ActivityTimeline activities={activities} /></Card>
    </div><aside className="record-aside"><Card><SectionHeading title="Contact details" /><div className="detail-grid"><div className="detail-item"><small>Lead source</small><strong>{contact.source}</strong></div><div className="detail-item"><small>Role</small><strong>{contact.role}</strong></div><div className="detail-item span-two"><small>Notes</small><strong>{contact.notes || "No notes"}</strong></div></div></Card><Card><SectionHeading title="Company account" /><Link className="table-link" href={`/companies/${contact.companyId}`}>{companyName(data, contact.companyId)} <ArrowRight size={12} /></Link><p className="page-description">{data.companies.find((item) => item.id === contact.companyId)?.industry}</p></Card><Card><SectionHeading title="Quick actions" /><div className="detail-actions"><a className="button" href={`mailto:${contact.email}`}><Mail size={13} />Email</a><a className="button" href={`tel:${contact.phone}`}><Phone size={13} />Call</a><Link className="button" href="/activities?create=1"><Plus size={13} />Log activity</Link></div></Card></aside></div>
    {editing && <RecordForm title="Edit contact" description="Update this sample contact record." fields={fields} initialValues={initialValues} onClose={() => setEditing(false)} onSubmit={save} />}
  </div>;
}

function CompanyDetail({ id }: { id: string }) {
  const { data, setData } = useDemoStore();
  const account = data.companies.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!account) return <NotFoundRecord kind="companies" />;
  const originalOwnerId = account.ownerId;
  const fields = getRecordFields("companies", data.companies.map((item) => item.name), data.owners.map((item) => item.name));
  const initialValues = { ...account, client: account.client ? "Client" : "Prospect", ownerName: ownerName(data, account.ownerId) } as unknown as Record<string, string>;
  const contacts = data.contacts.filter((item) => item.companyId === id);
  const deals = data.deals.filter((item) => item.companyId === id);
  const projects = data.projects.filter((item) => item.companyId === id);

  function save(values: Record<string, string>) {
    const ownerId = data.owners.find((item) => item.name === values.ownerName)?.id ?? originalOwnerId;
    setData((current) => ({ ...current, companies: current.companies.map((item) => item.id === id ? { ...item, name: values.name, industry: values.industry, website: values.website.replace(/^https?:\/\//, ""), size: values.size, location: values.location, ownerId, client: values.client === "Client", notes: values.notes } : item) }));
    setEditing(false);
  }

  return <div className="page-content"><DetailBack href="/companies" label="companies" /><PageTitle eyebrow="Company profile" title={account.name} description={`${account.industry} · ${account.location}`} actions={<button className="button" onClick={() => setEditing(true)}><Pencil size={13} />Edit company</button>} />
    <div className="record-layout"><div className="record-main">
      <Card><div className="record-hero"><span className="record-hero-icon"><Building2 size={20} /></span><div className="record-hero-copy"><h1>{account.name}</h1><p>{account.website} · {account.size} employees</p><div className="record-meta"><Badge tone={account.client ? "Client" : "New"}>{account.client ? "Active client" : "Prospect"}</Badge><Badge>{account.industry}</Badge></div></div></div><div className="detail-grid" style={{ marginTop: 20 }}><div className="detail-item"><small>Website</small><a href={`https://${account.website}`} target="_blank" rel="noreferrer">{account.website} <ExternalLink size={11} /></a></div><div className="detail-item"><small>Location</small><strong><MapPin size={12} /> {account.location}</strong></div><div className="detail-item"><small>Account owner</small><strong>{ownerName(data, account.ownerId)}</strong></div><div className="detail-item"><small>Company size</small><strong>{account.size}</strong></div></div><p className="page-description" style={{ marginTop: 17 }}>{account.notes}</p></Card>
      <Card><SectionHeading title="Contacts" detail={`${contacts.length} associated people`} />{contacts.length ? <div className="linked-record-list">{contacts.map((contact) => <Link className="linked-record" key={contact.id} href={`/contacts/${contact.id}`}><span className="table-person"><Avatar initials={contact.name.split(" ").map((part) => part[0]).join("")} color="#dcefe1" /><span><strong>{contact.name}</strong><small>{contact.role} · {contact.email}</small></span></span><ArrowRight size={14} /></Link>)}</div> : <p className="page-description">No contacts linked yet.</p>}</Card>
      <Card><SectionHeading title="Deals" detail="All pipeline and closed work for this account" />{deals.length ? <div className="linked-record-list">{deals.map((deal) => <Link className="linked-record" key={deal.id} href={`/deals/${deal.id}`}><span><strong>{deal.title}</strong><small>{deal.service} · expected {dateLabel(deal.closeDate)}</small></span><span className="linked-record-end"><Badge tone={deal.stage}>{deal.stage}</Badge><strong>{currency(deal.value)}</strong></span></Link>)}</div> : <p className="page-description">No linked deals.</p>}</Card>
      <Card><SectionHeading title="Projects" detail={`${projects.length} delivery projects`} />{projects.length ? <div className="linked-record-list">{projects.map((project) => <Link className="linked-record" key={project.id} href={`/projects/${project.id}`}><span><strong>{project.name}</strong><small>Deadline {dateLabel(project.deadline)}</small></span><Badge tone={project.status}>{project.status}</Badge></Link>)}</div> : <p className="page-description">No linked projects.</p>}</Card>
    </div><aside className="record-aside"><Card><SectionHeading title="Account snapshot" /><div className="detail-grid"><div className="detail-item"><small>Contacts</small><strong>{contacts.length}</strong></div><div className="detail-item"><small>Open deals</small><strong>{deals.filter((deal) => !["Won", "Lost"].includes(deal.stage)).length}</strong></div><div className="detail-item"><small>Open pipeline</small><strong>{currency(deals.filter((deal) => !["Won", "Lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.value, 0))}</strong></div><div className="detail-item"><small>Projects</small><strong>{projects.length}</strong></div></div></Card><Card><SectionHeading title="Account owner" /><div className="table-person"><Avatar initials={data.owners.find((owner) => owner.id === account.ownerId)?.initials ?? "--"} color={data.owners.find((owner) => owner.id === account.ownerId)?.color} /><strong className="table-primary">{ownerName(data, account.ownerId)}</strong></div></Card></aside></div>
    {editing && <RecordForm title="Edit company" description="Update this sample company profile." fields={fields} initialValues={initialValues} onClose={() => setEditing(false)} onSubmit={save} />}
  </div>;
}

function DealDetail({ id }: { id: string }) {
  const { data, setData } = useDemoStore();
  const deal = data.deals.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!deal) return <NotFoundRecord kind="deals" />;
  const originalCompanyId = deal.companyId;
  const originalContactId = deal.contactId;
  const originalOwnerId = deal.ownerId;
  const fields = getDealFields(data);
  const initialValues = { ...deal, companyName: companyName(data, deal.companyId), contactName: contactName(data, deal.contactId), ownerName: ownerName(data, deal.ownerId), value: String(deal.value) } as unknown as Record<string, string>;
  const company = data.companies.find((item) => item.id === deal.companyId);
  const activities = data.activities.filter((item) => item.relatedType === "Deal" && item.relatedId === id);
  const activeIndex = dealStages.indexOf(deal.stage);

  function save(values: Record<string, string>) {
    const companyId = data.companies.find((item) => item.name === values.companyName)?.id ?? originalCompanyId;
    const contactId = data.contacts.find((item) => item.name === values.contactName)?.id ?? originalContactId;
    const ownerId = data.owners.find((item) => item.name === values.ownerName)?.id ?? originalOwnerId;
    setData((current) => ({ ...current, deals: current.deals.map((item) => item.id === id ? { ...item, title: values.title, companyId, contactId, ownerId, value: Number(values.value), stage: values.stage as DealStage, closeDate: values.closeDate, service: values.service, notes: values.notes } : item) }));
    setEditing(false);
  }

  function changeStage(stage: DealStage) {
    setData((current) => ({ ...current, deals: current.deals.map((item) => item.id === id ? { ...item, stage } : item) }));
  }

  return <div className="page-content"><DetailBack href="/deals" label="deals" /><PageTitle eyebrow="Deal record" title={deal.title} description={`${company?.name ?? "Unknown company"} · ${deal.service}`} actions={<button className="button" onClick={() => setEditing(true)}><Pencil size={13} />Edit deal</button>} />
    <Card><div className="deal-hero-row"><div><div className="record-meta"><Badge tone={deal.stage}>{deal.stage}</Badge><Badge>{deal.service}</Badge></div><strong className="deal-value-large">{currency(deal.value, deal.currency)}</strong><p className="page-description">Open pipeline and closed revenue are tracked separately.</p></div><label className="filter-control"><span>Move stage</span><select className="select-control" value={deal.stage} onChange={(event) => changeStage(event.target.value as DealStage)} aria-label="Change deal stage">{dealStages.map((stage) => <option key={stage}>{stage}</option>)}</select></label></div><div className="stage-progress">{dealStages.map((stage, index) => <span key={stage} title={stage} className={`stage-step ${index <= activeIndex ? "is-done" : ""}`} />)}</div><div className="stage-labels"><span>New opportunity</span><span>Closed</span></div></Card>
    <div className="record-layout"><div className="record-main"><Card><SectionHeading title="Deal details" /><div className="detail-grid"><div className="detail-item"><small>Company</small><Link href={`/companies/${deal.companyId}`}>{company?.name}</Link></div><div className="detail-item"><small>Primary contact</small><Link href={`/contacts/${deal.contactId}`}>{contactName(data, deal.contactId)}</Link></div><div className="detail-item"><small>Deal owner</small><strong>{ownerName(data, deal.ownerId)}</strong></div><div className="detail-item"><small>Expected close</small><strong><CalendarDays size={12} /> {dateLabel(deal.closeDate)}</strong></div><div className="detail-item"><small>Currency</small><strong>{deal.currency}</strong></div><div className="detail-item"><small>Service</small><strong>{deal.service}</strong></div></div><p className="page-description" style={{ marginTop: 17 }}>{deal.notes}</p></Card><Card><SectionHeading title="Deal activity" /><ActivityTimeline activities={activities} /></Card></div><aside className="record-aside"><Card><SectionHeading title="Stage progression" detail="Update this sample deal as it moves." /><div className="stage-progress">{dealStages.map((stage, index) => <span key={stage} title={stage} className={`stage-step ${index <= activeIndex ? "is-done" : ""}`} />)}</div><div className="factor-row"><span>Current stage</span><span>{deal.stage}</span></div><div className="factor-row"><span>Expected close</span><span>{relativeDate(deal.closeDate)}</span></div><div className="factor-row"><span>Owner</span><span>{ownerName(data, deal.ownerId)}</span></div></Card><Card><SectionHeading title="Client context" /><Link className="table-link" href={`/companies/${deal.companyId}`}>{companyName(data, deal.companyId)} <ArrowRight size={12} /></Link><p className="page-description">{company?.industry} · {company?.location}</p><Link className="text-link" href={`/contacts/${deal.contactId}`}>{contactName(data, deal.contactId)} <ArrowRight size={12} /></Link></Card></aside></div>
    {editing && <RecordForm title="Edit deal" description="Update deal details in this demo pipeline." fields={fields} initialValues={initialValues} onClose={() => setEditing(false)} onSubmit={save} />}
  </div>;
}

function ProjectDetail({ id }: { id: string }) {
  const { data, setData } = useDemoStore();
  const project = data.projects.find((item) => item.id === id);
  const [editing, setEditing] = useState(false);
  if (!project) return <NotFoundRecord kind="projects" />;
  const originalCompanyId = project.companyId;
  const originalDealId = project.dealId;
  const originalOwnerId = project.ownerId;
  const fields = getProjectFields(data);
  const initialValues = { ...project, companyName: companyName(data, project.companyId), dealTitle: data.deals.find((item) => item.id === project.dealId)?.title ?? "", ownerName: ownerName(data, project.ownerId) } as unknown as Record<string, string>;
  const doneCount = project.deliverables.filter((item) => item.done).length;
  const progress = project.deliverables.length ? Math.round(doneCount / project.deliverables.length * 100) : 0;
  const company = data.companies.find((item) => item.id === project.companyId);
  const deal = data.deals.find((item) => item.id === project.dealId);
  const activities = data.activities.filter((item) => item.relatedType === "Project" && item.relatedId === id);

  function save(values: Record<string, string>) {
    const companyId = data.companies.find((item) => item.name === values.companyName)?.id ?? originalCompanyId;
    const dealId = data.deals.find((item) => item.title === values.dealTitle)?.id ?? originalDealId;
    const ownerId = data.owners.find((item) => item.name === values.ownerName)?.id ?? originalOwnerId;
    setData((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, name: values.name, companyId, dealId, ownerId, status: values.status as ProjectStatus, priority: values.priority as Project["priority"], startDate: values.startDate, deadline: values.deadline } : item) }));
    setEditing(false);
  }

  function toggleDeliverable(deliverableId: string) {
    setData((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, deliverables: item.deliverables.map((deliverable) => deliverable.id === deliverableId ? { ...deliverable, done: !deliverable.done } : deliverable) } : item) }));
  }

  return <div className="page-content"><DetailBack href="/projects" label="projects" /><PageTitle eyebrow="Client project" title={project.name} description={`${company?.name ?? "Unknown client"} · Delivery workspace`} actions={<button className="button" onClick={() => setEditing(true)}><Pencil size={13} />Edit project</button>} />
    <div className="record-layout"><div className="record-main"><Card><div className="record-meta"><Badge tone={project.status}>{project.status}</Badge><Badge tone={project.priority}>{project.priority} priority</Badge></div><div className="project-progress-block"><div className="progress-copy"><span>Deliverables</span><strong>{doneCount} of {project.deliverables.length} complete · {progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div><div className="detail-grid" style={{ marginTop: 20 }}><div className="detail-item"><small>Client company</small><Link href={`/companies/${project.companyId}`}>{company?.name}</Link></div><div className="detail-item"><small>Project owner</small><strong>{ownerName(data, project.ownerId)}</strong></div><div className="detail-item"><small>Start date</small><strong>{dateLabel(project.startDate)}</strong></div><div className="detail-item"><small>Deadline</small><strong>{dateLabel(project.deadline)}</strong></div><div className="detail-item"><small>Linked deal</small>{deal ? <Link href={`/deals/${deal.id}`}>{deal.title}</Link> : <strong>Not linked</strong>}</div><div className="detail-item"><small>Client context</small><strong>{company?.industry}</strong></div></div></Card>
      <Card><SectionHeading title="Deliverables" detail="Toggle items to update sample project progress." /><div className="deliverable-list">{project.deliverables.map((item) => <label className="deliverable-row" key={item.id}><input type="checkbox" checked={item.done} onChange={() => toggleDeliverable(item.id)} /><span>{item.title}</span>{item.done && <Badge tone="Completed">Complete</Badge>}</label>)}</div></Card>
      <Card><SectionHeading title="Project timeline" /><ActivityTimeline activities={activities} /></Card></div><aside className="record-aside"><Card><SectionHeading title="Project status" /><label className="field-label" htmlFor="project-status">Current status</label><select id="project-status" className="select-control" style={{ width: "100%" }} value={project.status} onChange={(event) => setData((current) => ({ ...current, projects: current.projects.map((item) => item.id === id ? { ...item, status: event.target.value as ProjectStatus } : item) }))}>{projectStatuses.map((status) => <option key={status}>{status}</option>)}</select><p className="field-hint">Status changes are demo-only.</p></Card><Card><SectionHeading title="Client account" /><Link className="table-link" href={`/companies/${project.companyId}`}>{company?.name} <ArrowRight size={12} /></Link><p className="page-description">{company?.location} · {company?.size} people</p></Card></aside></div>
    {editing && <RecordForm title="Edit project" description="Update this sample delivery project." fields={fields} initialValues={initialValues} onClose={() => setEditing(false)} onSubmit={save} />}
  </div>;
}

export function RecordDetailPage({ kind, id }: { kind: DetailKind; id: string }) {
  if (kind === "leads") return <LeadDetail id={id} />;
  if (kind === "contacts") return <ContactDetail id={id} />;
  if (kind === "companies") return <CompanyDetail id={id} />;
  if (kind === "deals") return <DealDetail id={id} />;
  return <ProjectDetail id={id} />;
}