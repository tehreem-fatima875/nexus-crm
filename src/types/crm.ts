export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal" | "Won" | "Lost";
export type DealStage = "New Opportunity" | "Qualified" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
export type ActivityType = "Task" | "Call" | "Meeting" | "Note" | "Follow-up";
export type ActivityStatus = "Upcoming" | "Completed" | "Overdue";
export type ProjectStatus = "Planning" | "In Progress" | "Review" | "Completed" | "On Hold";

export interface Owner {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName?: string;
  service: string;
  source: string;
  status: LeadStatus;
  score: number;
  ownerId: string;
  createdAt: string;
  budget: string;
  requirements: string;
  notes: string[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  companyId: string;
  source: string;
  ownerId: string;
  notes: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  size: string;
  ownerId: string;
  client: boolean;
  location: string;
  notes: string;
}

export interface Deal {
  id: string;
  title: string;
  companyId: string;
  contactId: string;
  value: number;
  currency: string;
  stage: DealStage;
  ownerId: string;
  closeDate: string;
  service: string;
  notes: string;
}

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  dueAt: string;
  priority: "Low" | "Medium" | "High";
  ownerId: string;
  relatedType: "Lead" | "Contact" | "Company" | "Deal" | "Project";
  relatedId: string;
  status: ActivityStatus;
  notes: string;
}

export interface Deliverable {
  id: string;
  title: string;
  done: boolean;
}

export interface Project {
  id: string;
  name: string;
  companyId: string;
  dealId: string;
  ownerId: string;
  status: ProjectStatus;
  priority: "Low" | "Medium" | "High";
  startDate: string;
  deadline: string;
  deliverables: Deliverable[];
}

export interface DemoData {
  owners: Owner[];
  leads: Lead[];
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  activities: Activity[];
  projects: Project[];
}

export type RecordCollection = "leads" | "contacts" | "companies" | "deals" | "activities" | "projects";