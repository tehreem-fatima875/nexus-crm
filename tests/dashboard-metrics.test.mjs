import assert from "node:assert/strict";
import test from "node:test";
import { initialDemoData } from "../src/data/demo-data.ts";
import { getDashboardMetrics } from "../src/lib/dashboard-metrics.ts";

test("dashboard KPIs match the CRM fixture records used by the Leads and Deals pages", () => {
  const metrics = getDashboardMetrics(initialDemoData, 3, new Date("2026-10-21T12:00:00"));

  assert.equal(initialDemoData.leads.length, 8);
  assert.equal(metrics.activeDeals.length, 5);
  assert.equal(metrics.wonDeals.reduce((total, deal) => total + deal.value, 0), 60_000);
});

test("revenue trend groups won deals by close month and excludes open and lost deals", () => {
  const metrics = getDashboardMetrics(initialDemoData, 3, new Date("2026-10-21T12:00:00"));

  assert.deepEqual(metrics.revenueData, [
    { month: "Aug", revenue: 0 },
    { month: "Sep", revenue: 18_000 },
    { month: "Oct", revenue: 42_000 },
  ]);
});

test("empty CRM records produce zero metrics and a zero-valued trend", () => {
  const metrics = getDashboardMetrics({
    owners: [],
    leads: [],
    contacts: [],
    companies: [],
    deals: [],
    activities: [],
    projects: [],
  }, 3, new Date("2026-10-21T12:00:00"));

  assert.equal(metrics.activeDeals.length, 0);
  assert.equal(metrics.wonDeals.length, 0);
  assert.equal(metrics.conversion, 0);
  assert.deepEqual(metrics.revenueData.map((point) => point.revenue), [0, 0, 0]);
});
