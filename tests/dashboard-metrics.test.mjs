import assert from "node:assert/strict";
import test from "node:test";
import {
  getDashboardMetrics,
  getDealsInMonthRange,
  getMonthlyWonRevenue,
} from "../src/lib/dashboard-metrics.ts";

const emptyData = {
  owners: [],
  leads: [],
  contacts: [],
  companies: [],
  deals: [],
  activities: [],
  projects: [],
};

test("dashboard metrics use the CRM record arrays", () => {
  const data = {
    ...emptyData,
    leads: [{ id: "lead-1", source: "Referral", status: "Qualified" }],
    deals: [
      { id: "deal-1", value: 12_000, stage: "Won", closeDate: "2026-10-02" },
      { id: "deal-2", value: 8_000, stage: "Negotiation", closeDate: "2026-10-20" },
      { id: "deal-3", value: 4_000, stage: "Lost", closeDate: "2026-10-21" },
    ],
  };
  const metrics = getDashboardMetrics(data, 3, new Date("2026-10-21T12:00:00"));

  assert.equal(metrics.qualified.length, 1);
  assert.equal(metrics.activeDeals.length, 1);
  assert.equal(metrics.wonDeals.reduce((total, deal) => total + deal.value, 0), 12_000);
  assert.deepEqual(metrics.sourceData, [{ name: "Referral", value: 1 }]);
});

test("revenue trend groups won deals by close month and excludes open and lost deals", () => {
  const deals = [
    { id: "deal-1", value: 12_000, stage: "Won", closeDate: "2026-10-02" },
    { id: "deal-2", value: 8_000, stage: "Won", closeDate: "2026-10-21" },
    { id: "deal-3", value: 4_000, stage: "Lost", closeDate: "2026-10-21" },
    { id: "deal-4", value: 5_000, stage: "Negotiation", closeDate: "2026-09-15" },
  ];

  assert.deepEqual(getMonthlyWonRevenue(deals, 3, new Date("2026-10-21T12:00:00")), [
    { month: "Aug", revenue: 0 },
    { month: "Sep", revenue: 0 },
    { month: "Oct", revenue: 20_000 },
  ]);
  assert.deepEqual(getDealsInMonthRange(deals, 3, new Date("2026-10-21T12:00:00")), deals);
});

test("empty CRM records produce zero metrics and a zero-valued trend", () => {
  const metrics = getDashboardMetrics(emptyData, 3, new Date("2026-10-21T12:00:00"));

  assert.equal(metrics.activeDeals.length, 0);
  assert.equal(metrics.wonDeals.length, 0);
  assert.equal(metrics.conversion, 0);
  assert.deepEqual(metrics.revenueData.map((point) => point.revenue), [0, 0, 0]);
});

test("reporting period excludes deals before its first calendar month", () => {
  const deals = [
    { id: "deal-1", value: 12_000, stage: "Won", closeDate: "2026-07-31" },
    { id: "deal-2", value: 8_000, stage: "Won", closeDate: "2026-08-01" },
    { id: "deal-3", value: 4_000, stage: "Lost", closeDate: "2026-11-01" },
  ];

  assert.deepEqual(
    getDealsInMonthRange(deals, 3, new Date("2026-10-21T12:00:00")),
    deals.slice(1, 2),
  );
});
