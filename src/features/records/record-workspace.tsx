"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import { RecordForm, type FormField } from "@/components/shared/record-form";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Avatar, Badge, PageTitle } from "@/components/shared/ui";
import { companyName, dateLabel, leadCompanyName, ownerIdByName, ownerName, shortDate } from "@/lib/format";
import type { Company, Contact, Lead, LeadStatus } from "@/types/crm";

export type RecordKind = "leads" | "contacts" | "companies";

const config = {
  leads: { title: "Leads", eyebrow: "Relationships", description: "Qualify new opportunities and keep every prospect moving forward.", singular: "lead" },
  contacts: { title: "Contacts", eyebrow: "Relationships", description: "A shared directory of the people behind your client and prospect relationships.", singular: "contact" },
  companies: { title: "Companies", eyebrow: "Relationships", description: "Keep client context, open opportunities, and account ownership together.", singular: "company" },
} satisfies Record<RecordKind, { title: string; eyebrow: string; description: string; singular: string }>;

const statusOptions = ["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"];

export function getRecordFields(kind: RecordKind, companyOptions: string[], ownerOptions: string[]): FormField[] {
  if (kind === "leads") return [
    { name: "name", label: "Lead name", required: true }, { name: "email", label: "Email", type: "email", required: true },
    { name: "companyName", label: "Company", required: true }, { name: "phone", label: "Phone", type: "tel" },
    { name: "service", label: "Service requested", type: "select", required: true, options: ["Web design", "Web development", "E-commerce development", "Digital marketing", "SEO", "Paid media", "Brand strategy", "Analytics"] },
    { name: "source", label: "Lead source", type: "select", required: true, options: ["Referral", "Website", "LinkedIn", "Content", "Event", "Organic search", "Partner referral"] },
    { name: "status", label: "Status", type: "select", required: true, options: statusOptions }, { name: "ownerName", label: "Owner", type: "select", required: true, options: ownerOptions },
    { name: "budget", label: "Budget", placeholder: "e.g. $10k-$15k / month" }, { name: "requirements", label: "Requirements", type: "textarea", wide: true },
  ];
  if (kind === "contacts") return [
    { name: "name", label: "Full name", required: true }, { name: "role", label: "Role", required: true },
    { name: "email", label: "Email", type: "email", required: true }, { name: "phone", label: "Phone", type: "tel" },
    { name: "companyName", label: "Company", type: "select", required: true, options: companyOptions }, { name: "source", label: "Lead source", type: "select", options: ["Referral", "Website", "LinkedIn", "Content", "Event", "Organic search"] },
{ name: "ownerName", label: "Owner", type: "text", required: true, placeholder: "Enter owner name" },
{ name: "notes", label: "Notes", type: "textarea", wide: true },
  ];
  return [
    { name: "name", label: "Company name", required: true }, { name: "industry", label: "Industry", required: true },
    { name: "website", label: "Website", type: "url", placeholder: "https://example.com" }, { name: "size", label: "Company size", type: "select", options: ["1-10", "11-50", "51-200", "201-500", "500+"] },
    { name: "location", label: "Location" }, { name: "ownerName", label: "Account owner", type: "select", required: true, options: ownerOptions },
    { name: "client", label: "Client status", type: "select", options: ["Prospect", "Client"] }, { name: "notes", label: "Account notes", type: "textarea", wide: true },
  ];
}

export function RecordWorkspace({ kind, initialCreate = false }: { kind: RecordKind; initialCreate?: boolean }) {
  const { data, setData, createLead } = useDemoStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [owner, setOwner] = useState("All owners");
  const [source, setSource] = useState("All sources");
  const [service, setService] = useState("All services");
  const [company, setCompany] = useState("All companies");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });
  const [formOpen, setFormOpen] = useState(initialCreate);
  const pageConfig = config[kind];

  const allRows = kind === "leads" ? data.leads : kind === "contacts" ? data.contacts : data.companies;
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const rows = allRows.filter((record) => {
      if (kind === "leads") {
        const lead = record as Lead;
        return (!term || `${lead.name} ${lead.email} ${leadCompanyName(data, lead)} ${lead.service}`.toLowerCase().includes(term))
          && (status === "All statuses" || lead.status === status)
          && (source === "All sources" || lead.source === source)
          && (owner === "All owners" || ownerName(data, lead.ownerId) === owner)
          && (service === "All services" || lead.service === service);
      }
      if (kind === "contacts") {
        const contact = record as Contact;
        return (!term || `${contact.name} ${contact.email} ${contact.role} ${companyName(data, contact.companyId)}`.toLowerCase().includes(term))
          && (owner === "All owners" || ownerName(data, contact.ownerId) === owner)
          && (source === "All sources" || contact.source === source)
          && (company === "All companies" || companyName(data, contact.companyId) === company);
      }
      const account = record as Company;
      return (!term || `${account.name} ${account.industry} ${account.website} ${account.location}`.toLowerCase().includes(term))
        && (owner === "All owners" || ownerName(data, account.ownerId) === owner)
        && (status === "All statuses" || (status === "Client" ? account.client : !account.client));
    });
    return [...rows].sort((left, right) => {
      const a = (left as unknown as Record<string, string | number>)[sort.key] ?? "";
      const b = (right as unknown as Record<string, string | number>)[sort.key] ?? "";
      return String(a).localeCompare(String(b), undefined, { numeric: true }) * (sort.direction === "asc" ? 1 : -1);
    });
  }, [allRows, company, data, kind, owner, query, service, sort, source, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const fields = getRecordFields(kind, data.companies.map((item) => item.name), data.owners.map((item) => item.name));

  function toggleSort(key: string) {
    setSort((current) => current.key === key ? { key, direction: current.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" });
  }

  async function createRecord(values: Record<string, string>) {
    const id = `${kind.slice(0, 2)}${Date.now().toString(36)}`;
    const typedCompanyName = values.companyName?.trim() ?? "";
    const matchedCompany = kind === "leads"
      ? data.companies.find((item) => item.name.trim().toLowerCase() === typedCompanyName.toLowerCase())
      : data.companies.find((item) => item.name === values.companyName);
    const companyId = matchedCompany?.id ?? (kind === "leads" ? "" : data.companies[0]?.id ?? "");
    const ownerId = ownerIdByName(data, values.ownerName);
    if (!ownerId) throw new Error("Enter the name of a configured workspace owner.");
    if (kind === "leads") {
      const lead: Lead = { id, name: values.name, email: values.email, phone: values.phone ?? "", companyId, companyName: typedCompanyName, service: values.service, source: values.source, status: (values.status || "New") as LeadStatus, score: 50, ownerId, createdAt: new Date().toISOString().slice(0, 10), budget: values.budget ?? "Not shared", requirements: values.requirements ?? "", notes: [] };
      await createLead(lead);
    } else if (kind === "contacts") {
      const contact: Contact = { id, name: values.name, email: values.email, phone: values.phone ?? "", role: values.role, companyId, source: values.source || "Referral", ownerId, notes: values.notes ?? "" };
      setData((current) => ({ ...current, contacts: [contact, ...current.contacts] }));
    } else {
      const account: Company = { id, name: values.name, industry: values.industry, website: values.website?.replace(/^https?:\/\//, "") ?? "", size: values.size || "1-10", ownerId, client: values.client === "Client", location: values.location ?? "", notes: values.notes ?? "" };
      setData((current) => ({ ...current, companies: [account, ...current.companies] }));
    }
    setPage(1);
    setFormOpen(false);
  }

  function sortButton(label: string, key: string) {
    const icon = sort.key === key ? sort.direction === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} /> : null;
    return <button className="sort-button" onClick={() => toggleSort(key)}>{label}{icon}</button>;
  }

  return <div className="page-content">
    <PageTitle eyebrow={pageConfig.eyebrow} title={pageConfig.title} description={pageConfig.description} actions={<button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={14} />Add {pageConfig.singular}</button>} />
    <section className="panel">
      <div className="table-toolbar">
        <label className="search-control"><Search size={14} /><input className="input-control" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={kind === "leads" ? "Search name, company, email, service..." : `Search ${pageConfig.title.toLowerCase()}...`} aria-label={`Search ${pageConfig.title.toLowerCase()}`} /></label>
        {kind === "leads" && <>
          <label className="filter-control"><span className="sr-only">Filter by status</span><select className="select-control" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>All statuses</option>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="filter-control"><span className="sr-only">Filter by source</span><select className="select-control" value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}><option>All sources</option>{[...new Set(data.leads.map((item) => item.source))].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="filter-control"><span className="sr-only">Filter by service</span><select className="select-control" value={service} onChange={(event) => { setService(event.target.value); setPage(1); }}><option>All services</option>{[...new Set(data.leads.map((item) => item.service))].map((item) => <option key={item}>{item}</option>)}</select></label>
        </>}
        {kind === "contacts" && <label className="filter-control"><span className="sr-only">Filter by company</span><select className="select-control" value={company} onChange={(event) => { setCompany(event.target.value); setPage(1); }}><option>All companies</option>{data.companies.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>}
        {kind === "companies" && <label className="filter-control"><span className="sr-only">Filter by client status</span><select className="select-control" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>All statuses</option><option>Client</option><option>Prospect</option></select></label>}
        <label className="filter-control"><span className="sr-only">Filter by owner</span><select className="select-control" value={owner} onChange={(event) => { setOwner(event.target.value); setPage(1); }}><option>All owners</option>{data.owners.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className="table-wrap"><table className="data-table">
        {kind === "leads" && <><thead><tr><th>{sortButton("Lead", "name")}</th><th>Company</th><th>{sortButton("Service", "service")}</th><th>Source</th><th>{sortButton("Status", "status")}</th><th>{sortButton("Score", "score")}</th><th>Owner</th><th>{sortButton("Created", "createdAt")}</th></tr></thead><tbody>{(visible as Lead[]).map((lead) => <tr key={lead.id}><td><Link className="table-link" href={`/leads/${lead.id}`}>{lead.name}</Link><div className="table-secondary">{lead.email}</div></td><td>{leadCompanyName(data, lead)}</td><td>{lead.service}</td><td>{lead.source}</td><td><Badge tone={lead.status}>{lead.status}</Badge></td><td><span className="score-cell">{lead.score}<span className="score-track"><span style={{ width: `${lead.score}%` }} /></span></span></td><td><span className="table-person"><Avatar initials={data.owners.find((item) => item.id === lead.ownerId)?.initials ?? "--"} color={data.owners.find((item) => item.id === lead.ownerId)?.color} size="small" />{ownerName(data, lead.ownerId)}</span></td><td>{dateLabel(lead.createdAt)}</td></tr>)}</tbody></>}
        {kind === "contacts" && <><thead><tr><th>{sortButton("Contact", "name")}</th><th>Company</th><th>Role</th><th>Email</th><th>Phone</th><th>Source</th><th>Owner</th></tr></thead><tbody>{(visible as Contact[]).map((contact) => <tr key={contact.id}><td><Link className="table-link" href={`/contacts/${contact.id}`}>{contact.name}</Link></td><td><Link className="text-link" href={`/companies/${contact.companyId}`}>{companyName(data, contact.companyId)}</Link></td><td>{contact.role}</td><td><a className="table-link" href={`mailto:${contact.email}`}>{contact.email}</a></td><td>{contact.phone}</td><td>{contact.source}</td><td><span className="table-person"><Avatar initials={data.owners.find((item) => item.id === contact.ownerId)?.initials ?? "--"} color={data.owners.find((item) => item.id === contact.ownerId)?.color} size="small" />{ownerName(data, contact.ownerId)}</span></td></tr>)}</tbody></>}
        {kind === "companies" && <><thead><tr><th>{sortButton("Company", "name")}</th><th>{sortButton("Industry", "industry")}</th><th>Website</th><th>Size</th><th>Contacts</th><th>Open deals</th><th>Owner</th><th>Relationship</th></tr></thead><tbody>{(visible as Company[]).map((account) => <tr key={account.id}><td><Link className="table-link" href={`/companies/${account.id}`}>{account.name}</Link><div className="table-secondary">{account.location}</div></td><td>{account.industry}</td><td><a className="text-link" href={`https://${account.website}`} target="_blank" rel="noreferrer">{account.website}</a></td><td>{account.size}</td><td>{data.contacts.filter((item) => item.companyId === account.id).length}</td><td>{data.deals.filter((item) => item.companyId === account.id && !["Won", "Lost"].includes(item.stage)).length}</td><td>{ownerName(data, account.ownerId)}</td><td><Badge tone={account.client ? "Client" : "New"}>{account.client ? "Client" : "Prospect"}</Badge></td></tr>)}</tbody></>}
      </table>{visible.length === 0 && <div className="empty-state"><span className="empty-mark"><Search size={15} /></span><h3>No {pageConfig.title.toLowerCase()} match</h3><p>Try adjusting the search or filters, or add a new {pageConfig.singular}.</p></div>}</div>
      <div className="table-footer"><span>{filtered.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} ${pageConfig.title.toLowerCase()}` : `0 ${pageConfig.title.toLowerCase()}`}</span><div className="pagination"><label className="filter-control"><span>Rows</span><select className="select-control" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Rows per page"><option value={6}>6</option><option value={10}>10</option><option value={20}>20</option></select></label><button aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}><ChevronLeft size={14} /></button><span>Page {page} of {pageCount}</span><button aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(current + 1, pageCount))}><ChevronRight size={14} /></button></div></div>
    </section>
    <p className="field-hint">Records are saved to the CRM database.</p>
    {formOpen && <RecordForm title={`Add ${pageConfig.singular}`} description={`Create a ${pageConfig.singular} in this demo workspace.`} fields={fields} submitLabel={`Create ${pageConfig.singular}`} onClose={() => setFormOpen(false)} onSubmit={createRecord} />}
  </div>;
}