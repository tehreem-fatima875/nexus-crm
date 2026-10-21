import type { Deal, DemoData } from "@/types/crm";

export interface RevenuePoint {
  month: string;
  revenue: number;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthlyWonRevenue(deals: readonly Deal[], periodMonths: 3 | 6 | 12, now = new Date()) {
  const revenueIndexByMonth = new Map<string, number>();
  const revenueData: RevenuePoint[] = [];

  for (let offset = periodMonths - 1; offset >= 0; offset -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    revenueIndexByMonth.set(monthKey(monthDate), revenueData.length);
    revenueData.push({
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(monthDate),
      revenue: 0,
    });
  }

  for (const deal of deals) {
    if (deal.stage !== "Won") continue;
    const index = revenueIndexByMonth.get(deal.closeDate.slice(0, 7));
    if (index !== undefined) revenueData[index].revenue += deal.value;
  }

  return revenueData;
}

export function getDealsInMonthRange(deals: readonly Deal[], periodMonths: 3 | 6 | 12, now = new Date()) {
  const firstMonth = monthKey(new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 1));
  const nextMonth = monthKey(new Date(now.getFullYear(), now.getMonth() + 1, 1));
  return deals.filter((deal) => {
    const closeMonth = deal.closeDate.slice(0, 7);
    return closeMonth >= firstMonth && closeMonth < nextMonth;
  });
}

export function getDashboardMetrics(data: DemoData, periodMonths: 3 | 6 | 12, now = new Date()) {
  const activeDeals = data.deals.filter((deal) => !["Won", "Lost"].includes(deal.stage));
  const wonDeals = data.deals.filter((deal) => deal.stage === "Won");
  const overdue = data.activities.filter((activity) => activity.status === "Overdue");
  const qualified = data.leads.filter((lead) => ["Qualified", "Proposal"].includes(lead.status));
  const sourceCounts = data.leads.reduce<Record<string, number>>((counts, lead) => {
    counts[lead.source] = (counts[lead.source] ?? 0) + 1;
    return counts;
  }, {});
  return {
    activeDeals,
    wonDeals,
    overdue,
    qualified,
    conversion: data.leads.length ? Math.round((wonDeals.length / data.leads.length) * 100) : 0,
    sourceData: Object.entries(sourceCounts).map(([name, value]) => ({ name, value })),
    revenueData: getMonthlyWonRevenue(data.deals, periodMonths, now),
  };
}
