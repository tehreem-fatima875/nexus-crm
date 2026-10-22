import type { DemoData, Lead } from "@/types/crm";

export const currency = (value: number, code = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(value);

export const dateLabel = (value: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) =>
  new Intl.DateTimeFormat("en-US", options).format(new Date(`${value.slice(0, 10)}T12:00:00`));

export const shortDate = (value: string) => dateLabel(value, { month: "short", day: "numeric" });

export const ownerName = (data: DemoData, ownerId: string) =>
  data.owners.find((owner) => owner.id === ownerId)?.name ?? "Unassigned";

export const ownerIdByName = (data: DemoData, name: string) => {
  const normalizedName = name.trim().toLocaleLowerCase();
  return data.owners.find((owner) => owner.name.trim().toLocaleLowerCase() === normalizedName)?.id;
};

export const companyName = (data: DemoData, companyId: string) =>
  data.companies.find((company) => company.id === companyId)?.name ?? "Unknown company";

export const leadCompanyName = (data: DemoData, lead: Lead) =>
  lead.companyId ? companyName(data, lead.companyId) : lead.companyName?.trim() || "Unknown company";

export const contactName = (data: DemoData, contactId: string) =>
  data.contacts.find((contact) => contact.id === contactId)?.name ?? "Unknown contact";

export const relativeDate = (value: string) => {
  const target = Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};