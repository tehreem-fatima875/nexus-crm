"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileDown } from "lucide-react";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Card, PageTitle, SectionHeading } from "@/components/shared/ui";
import { chartColors, demoRevenueTrend } from "@/data/demo-analytics";
import { currency } from "@/lib/format";
import type { DealStage } from "@/types/crm";

const stages: DealStage[] = ["New Opportunity", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"];
type Range = "3 months" | "6 months" | "12 months";

function escapeCsv(value: string | number) {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function ReportTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.name} style={{ color: item.color }}>{item.name}: {typeof item.value === "number" && item.name?.toLowerCase().includes("revenue") ? currency(item.value) : item.value}</span>)}</div>;
}

export function ReportsPage() {
  const { data } = useDemoStore();
  const [range, setRange] = useState<Range>("6 months");
  const rangeMonths = range === "3 months" ? 3 : range === "6 months" ? 6 : 12;
  const revenue = demoRevenueTrend.slice(-rangeMonths);
  const relevantDeals = useMemo(() => {
    const date = new Date("2026-10-18T12:00:00");
    date.setMonth(date.getMonth() - rangeMonths);
    return data.deals.filter((deal) => new Date(`${deal.closeDate}T12:00:00`) >= date);
  }, [data.deals, rangeMonths]);
  const wonDeals = relevantDeals.filter((deal) => deal.stage === "Won");
  const lostDeals = relevantDeals.filter((deal) => deal.stage === "Lost");
  const totalWon = wonDeals.reduce((sum, deal) => sum + deal.value, 0);
  const avgWon = wonDeals.length ? Math.round(totalWon / wonDeals.length) : 0;
  const stageData = stages.map((stage) => ({ name: stage, count: relevantDeals.filter((deal) => deal.stage === stage).length, value: relevantDeals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + deal.value, 0) }));
  const sourceData = Object.entries(data.leads.reduce<Record<string, number>>((counts, lead) => { counts[lead.source] = (counts[lead.source] ?? 0) + 1; return counts; }, {})).map(([name, value]) => ({ name, value }));
  const owners = data.owners.map((owner) => {
    const deals = relevantDeals.filter((deal) => deal.ownerId === owner.id);
    return { name: owner.name.split(" ")[0], won: deals.filter((deal) => deal.stage === "Won").reduce((sum, deal) => sum + deal.value, 0), open: deals.filter((deal) => !["Won", "Lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.value, 0) };
  });
  const maxFunnel = Math.max(data.leads.length, 1);
  const funnel = [
    { label: "All leads", count: data.leads.length },
    { label: "Contacted", count: data.leads.filter((lead) => lead.status !== "New").length },
    { label: "Qualified", count: data.leads.filter((lead) => ["Qualified", "Proposal", "Won"].includes(lead.status)).length },
    { label: "Proposal", count: data.leads.filter((lead) => ["Proposal", "Won"].includes(lead.status)).length },
    { label: "Won", count: data.leads.filter((lead) => lead.status === "Won").length },
  ];

  function exportCsv() {
    const header = ["Deal", "Company", "Contact", "Stage", "Value", "Currency", "Owner", "Expected close"];
    const rows = relevantDeals.map((deal) => [deal.title, data.companies.find((company) => company.id === deal.companyId)?.name ?? "", data.contacts.find((contact) => contact.id === deal.contactId)?.name ?? "", deal.stage, deal.value, deal.currency, data.owners.find((owner) => owner.id === deal.ownerId)?.name ?? "", deal.closeDate]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nexus-demo-deals-${range.replace(" ", "-")}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="page-content">
    <PageTitle eyebrow="Intelligence" title="Reports" description="Explore sample sales, revenue, conversion, and lead-source data. Figures are illustrative and not connected to a live business." actions={<><label className="filter-control"><span className="sr-only">Report date range</span><select className="select-control" value={range} onChange={(event) => setRange(event.target.value as Range)}><option>3 months</option><option>6 months</option><option>12 months</option></select></label><button className="button button-primary" onClick={exportCsv}><Download size={14} />Export deals CSV</button></>} />
    <div className="report-kpis"><Card><small>Closed-won revenue</small><strong>{currency(totalWon)}</strong><span>{range} · sample deals</span></Card><Card><small>Average won deal</small><strong>{currency(avgWon)}</strong><span>{wonDeals.length} closed-won records</span></Card><Card><small>Won / lost deals</small><strong>{wonDeals.length} / {lostDeals.length}</strong><span>Selected date range</span></Card><Card><small>Open pipeline</small><strong>{currency(relevantDeals.filter((deal) => !["Won", "Lost"].includes(deal.stage)).reduce((sum, deal) => sum + deal.value, 0))}</strong><span>Open value · USD</span></Card></div>
    <div className="report-grid">
      <Card className="report-chart"><SectionHeading title="Revenue over time" detail="Sample monthly closed revenue · USD" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenue} margin={{ top: 8, right: 7, bottom: 0, left: -18 }}><defs><linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#438259" stopOpacity={0.2} /><stop offset="100%" stopColor="#438259" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1ed" strokeDasharray="3 4" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#89948b", fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#89948b", fontSize: 9 }} tickFormatter={(value: number) => `$${value / 1000}k`} /><Tooltip content={<ReportTooltip />} /><Area type="monotone" dataKey="revenue" name="Revenue" stroke="#327548" fill="url(#reportRevenueFill)" strokeWidth={2.2} activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div><p className="field-hint">Monthly trend is illustrative sample data.</p></Card>
      <Card className="report-chart"><SectionHeading title="Lead conversion funnel" detail="Current demo lead statuses" /><div className="funnel-list">{funnel.map((item) => <div className="funnel-row" key={item.label}><span>{item.label}</span><div className="funnel-track"><span style={{ width: `${Math.max(item.count / maxFunnel * 100, item.count ? 5 : 0)}%` }} /></div><strong>{item.count}</strong></div>)}</div><div className="report-note">Counts are record totals, not a time-based cohort conversion analysis.</div></Card>
      <Card className="report-chart"><SectionHeading title="Deals by stage" detail={`Selected close period · ${relevantDeals.length} records`} /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={stageData} layout="vertical" margin={{ top: 2, right: 15, bottom: 0, left: 6 }}><CartesianGrid horizontal={false} stroke="#edf1ed" strokeDasharray="3 4" /><XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#89948b", fontSize: 9 }} /><YAxis type="category" dataKey="name" width={92} tickLine={false} axisLine={false} tick={{ fill: "#657168", fontSize: 9 }} /><Tooltip formatter={(value) => [`${value} deals`, "Count"]} /><Bar dataKey="count" name="Deals" radius={[0, 4, 4, 0]}>{stageData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
      <Card className="report-chart"><SectionHeading title="Lead sources" detail="All sample leads by original source" /><div className="source-report-layout"><div className="source-donut"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={43} outerRadius={67} paddingAngle={3} stroke="none">{sourceData.map((item, index) => <Cell key={item.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => [`${value} leads`, "Count"]} /></PieChart></ResponsiveContainer></div><div className="source-list">{sourceData.map((item, index) => <div className="source-row" key={item.name}><i className="legend-dot" style={{ background: chartColors[index % chartColors.length] }} /><span>{item.name}</span><strong>{item.value}</strong><small>{Math.round(item.value / Math.max(data.leads.length, 1) * 100)}%</small></div>)}</div></div></Card>
      <Card className="report-chart"><SectionHeading title="Sales performance by owner" detail="Closed-won and open value · USD" /><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={owners} margin={{ top: 8, right: 8, bottom: 0, left: -15 }}><CartesianGrid vertical={false} stroke="#edf1ed" strokeDasharray="3 4" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#657168", fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#89948b", fontSize: 9 }} tickFormatter={(value: number) => `$${value / 1000}k`} /><Tooltip content={<ReportTooltip />} /><Bar dataKey="won" name="Won revenue" stackId="a" fill="#438259" radius={[0, 0, 0, 0]} /><Bar dataKey="open" name="Open pipeline" stackId="a" fill="#b7cfbb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><div className="chart-legend"><span className="legend-item"><i className="legend-dot" style={{ background: "#438259" }} />Won revenue</span><span className="legend-item"><i className="legend-dot" style={{ background: "#b7cfbb" }} />Open pipeline</span></div></Card>
      <Card className="report-chart"><SectionHeading title="Won and lost analysis" detail="Closed deal comparison · selected close period" /><div className="won-lost-grid"><div className="won-lost-cell won"><small>Won</small><strong>{wonDeals.length}</strong><span>{currency(wonDeals.reduce((sum, deal) => sum + deal.value, 0))}</span></div><div className="won-lost-cell lost"><small>Lost</small><strong>{lostDeals.length}</strong><span>{currency(lostDeals.reduce((sum, deal) => sum + deal.value, 0))}</span></div><div className="won-lost-cell"><small>Closed records</small><strong>{wonDeals.length + lostDeals.length}</strong><span>Not a forecast</span></div></div><p className="report-note">This is a descriptive view of sample records; it does not estimate future results.</p></Card>
    </div>
    <div className="report-export-strip"><span><FileDown size={15} /><span><strong>Export sample deal records</strong><small>Includes company, stage, amount, owner, and expected close date.</small></span></span><button className="button" onClick={exportCsv}><Download size={13} />Download CSV</button></div>
  </div>;
}