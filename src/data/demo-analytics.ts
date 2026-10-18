export interface RevenuePoint {
  month: string;
  revenue: number;
  target: number;
}

export const demoRevenueTrend: RevenuePoint[] = [
  { month: "Nov", revenue: 39000, target: 38000 },
  { month: "Dec", revenue: 52000, target: 44000 },
  { month: "Jan", revenue: 47000, target: 46000 },
  { month: "Feb", revenue: 58000, target: 49000 },
  { month: "Mar", revenue: 51000, target: 51000 },
  { month: "Apr", revenue: 64000, target: 53000 },
  { month: "May", revenue: 46000, target: 42000 },
  { month: "Jun", revenue: 53000, target: 47000 },
  { month: "Jul", revenue: 49000, target: 50000 },
  { month: "Aug", revenue: 68000, target: 54000 },
  { month: "Sep", revenue: 61000, target: 58000 },
  { month: "Oct", revenue: 74000, target: 62000 },
];

export const chartColors = ["#42835b", "#85a98b", "#d5a65c", "#7b9cac", "#b56b60", "#a8b8a7"];