"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, CircleAlert,
  CircleDollarSign, ContactRound, Plus, Sparkles, UsersRound,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { useDemoStore } from "@/components/shared/demo-provider";
import { Badge, Card, SectionHeading } from "@/components/shared/ui";
import { chartColors } from "@/data/demo-analytics";
import { getDashboardMetrics } from "@/lib/dashboard-metrics";
import { currency, leadCompanyName, ownerName, relativeDate, shortDate } from "@/lib/format";

const periods = ["6 months", "3 months", "12 months"] as const;
type Period = (typeof periods)[number];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={item.name} style={{ color: item.color }}>{item.name}: {currency(item.value ?? 0)}</span>)}</div>;
}

export function DashboardPage() {
  const { data, setData } = useDemoStore();
  const [period, setPeriod] = useState<Period>("6 months");
  const [today, setToday] = useState("");
  const periodMonths = period === "3 months" ? 3 : period === "6 months" ? 6 : 12;
  const { activeDeals, wonDeals, overdue, qualified, conversion, sourceData, revenueData } =
    getDashboardMetrics(data, periodMonths);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setToday(new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const stages = ["New Opportunity", "Qualified", "Proposal Sent", "Negotiation"] as const;
  const maxStageValue = Math.max(...stages.map((stage) => activeDeals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + deal.value, 0)), 1);
  const tasks = data.activities.filter((item) => item.status !== "Completed").sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 4);
  const recentLeads = [...data.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recentActivity = [...data.activities].sort((a, b) => b.dueAt.localeCompare(a.dueAt)).slice(0, 4);

  function completeTask(id: string) {
    setData((current) => ({ ...current, activities: current.activities.map((item) => item.id === id ? { ...item, status: "Completed" } : item) }));
  }

  const kpis = [
    { label: "Total leads", value: data.leads.length.toString(), detail: "In CRM pipeline", icon: UsersRound, tone: "neutral" },
    { label: "Qualified leads", value: qualified.length.toString(), detail: `${data.leads.length ? Math.round(qualified.length / data.leads.length * 100) : 0}% of leads`, icon: Sparkles, tone: "good" },
    { label: "Active deals", value: activeDeals.length.toString(), detail: currency(activeDeals.reduce((sum, deal) => sum + deal.value, 0)) + " open", icon: BriefcaseBusiness, tone: "neutral" },
    { label: "Revenue won", value: currency(wonDeals.reduce((sum, deal) => sum + deal.value, 0)), detail: "Closed-won · USD", icon: CircleDollarSign, tone: "good" },
    { label: "Conversion rate", value: `${conversion}%`, detail: "Won deals / leads", icon: ContactRound, tone: "good" },
    { label: "Overdue tasks", value: overdue.length.toString(), detail: overdue.length ? "Needs attention" : "All caught up", icon: CircleAlert, tone: overdue.length ? "alert" : "good" },
  ];

  return <div className="page-content">
    <div className="welcome-row">
      <div><p className="eyebrow">{today}</p><h1>Welcome back, Maya <Sparkles size={16} aria-hidden="true" /></h1><p>Here’s what’s moving across your agency workspace.</p></div>
      <div className="welcome-actions"><Link className="button" href="/activities?create=1"><Plus size={14} />Add task</Link><Link className="button button-primary" href="/leads?create=1"><Plus size={14} />Create lead</Link></div>
    </div>
    <div className="kpi-grid">{kpis.map(({ label, value, detail, icon: Icon, tone }) => <div className="kpi-card" key={label}>
      <div className="kpi-label"><span>{label}</span><span className="kpi-icon"><Icon size={14} /></span></div><strong className="kpi-value">{value}</strong><span className={`kpi-change ${tone === "neutral" ? "neutral" : ""}`}>{tone === "alert" ? <ArrowDownRight size={12} /> : tone === "good" ? <ArrowUpRight size={12} /> : null}{detail}</span>
    </div>)}</div>
    <div className="dashboard-chart">
      <Card className="chart-card">
        <SectionHeading title="Revenue trend" detail="Won deals by close date · USD" action={<select className="select-control" value={period} onChange={(event) => setPeriod(event.target.value as Period)} aria-label="Revenue chart date range">{periods.map((item) => <option key={item}>{item}</option>)}</select>} />
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 8, right: 6, bottom: 0, left: -17 }}>
          <defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4d8a5f" stopOpacity={0.17} /><stop offset="100%" stopColor="#4d8a5f" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid vertical={false} stroke="#edf1ed" strokeDasharray="3 4" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#89948b", fontSize: 9 }} tickMargin={9} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "#89948b", fontSize: 9 }} tickFormatter={(value: number) => `$${value / 1000}k`} /><Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="revenue" name="Won revenue" stroke="#327548" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
        </AreaChart></ResponsiveContainer></div>
        <div className="chart-legend"><span className="legend-item"><i className="legend-dot" style={{ background: "#327548" }} />Won revenue</span><span className="legend-item">CRM records · monthly close date</span></div>
      </Card>
      <Card>
        <SectionHeading title="Lead sources" detail="CRM leads by first touch" />
        <div className="chart-wrap" style={{ height: 150 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={68} paddingAngle={3} stroke="none">{sourceData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => [`${value} leads`, "Count"]} /></PieChart></ResponsiveContainer></div>
        <div className="source-list">{sourceData.slice(0, 5).map((source, index) => <div className="source-row" key={source.name}><i className="legend-dot" style={{ background: chartColors[index % chartColors.length] }} /><span>{source.name}</span><strong>{source.value}</strong><small>{Math.round(source.value / Math.max(data.leads.length, 1) * 100)}%</small></div>)}</div>
      </Card>
    </div>
    <div className="dashboard-grid">
      <Card><SectionHeading title="Sales pipeline" detail="Open deal value by stage · USD" action={<Link className="text-link" href="/deals">Open pipeline <ArrowRight size={13} /></Link>} />
        <div className="pipeline-list">{stages.map((stage) => { const deals = activeDeals.filter((deal) => deal.stage === stage); const amount = deals.reduce((sum, deal) => sum + deal.value, 0); return <div className="pipeline-row" key={stage}><label>{stage}</label><div className="pipeline-bar"><span style={{ width: `${Math.max(amount / maxStageValue * 100, amount ? 8 : 0)}%` }} /></div><span className="pipeline-amount">{currency(amount)}</span></div>; })}</div>
        <div className="chart-legend" style={{ marginTop: 18 }}><span className="legend-item">{activeDeals.length} open opportunities</span><span className="legend-item">{currency(activeDeals.reduce((sum, deal) => sum + deal.value, 0))} open value</span></div>
      </Card>
      <Card><SectionHeading title="Follow-ups" detail={`${overdue.length} overdue · ${tasks.length} next up`} action={<Link className="text-link" href="/activities">All activities <ArrowRight size={13} /></Link>} />
        <div className="task-list">{tasks.map((task) => <label className="task-row" key={task.id}><input className="task-check" type="checkbox" aria-label={`Complete ${task.title}`} onChange={() => completeTask(task.id)} /><span className="task-copy"><strong>{task.title}</strong><p>{task.type} · {ownerName(data, task.ownerId)}</p></span><span className={`task-date ${task.status === "Overdue" ? "is-overdue" : ""}`}>{task.status === "Overdue" ? "Overdue" : relativeDate(task.dueAt)}</span></label>)}</div>
      </Card>
    </div>
    <div className="dashboard-grid">
      <Card><SectionHeading title="Recent leads" detail="The latest activity in your sample pipeline" action={<Link className="text-link" href="/leads">View all leads <ArrowRight size={13} /></Link>} />
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Lead</th><th>Company</th><th>Service</th><th>Status</th><th>Score</th><th>Added</th></tr></thead><tbody>{recentLeads.map((lead) => <tr key={lead.id}><td><Link className="table-link" href={`/leads/${lead.id}`}>{lead.name}</Link><div className="table-secondary">{lead.email}</div></td><td>{leadCompanyName(data, lead)}</td><td>{lead.service}</td><td><Badge tone={lead.status}>{lead.status}</Badge></td><td><span className="score-cell"><span>{lead.score}</span><span className="score-track"><span style={{ width: `${lead.score}%` }} /></span></span></td><td>{shortDate(lead.createdAt)}</td></tr>)}</tbody></table></div>
      </Card>
      <Card><SectionHeading title="Activity feed" detail="Recent touches across the workspace" action={<Link className="text-link" href="/activities">View activity <ArrowRight size={13} /></Link>} />
        <div className="activity-list">{recentActivity.map((item) => <div className="activity-feed-item" key={item.id}><span className="activity-feed-icon"><Activity size={13} /></span><div className="activity-feed-copy"><strong>{item.title}</strong><p>{item.type} · {ownerName(data, item.ownerId)}</p><small>{shortDate(item.dueAt)}</small></div></div>)}</div>
      </Card>
    </div>
    <p className="field-hint">Record totals use saved CRM data; the revenue trend remains illustrative.</p>
  </div>;
}