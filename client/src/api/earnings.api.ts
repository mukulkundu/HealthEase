import client from "./client";
import type { ApiResponse } from "../types";

export interface EarningsSummary {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  thisWeekEarnings: number;
  totalAppointments: number;
  paidAppointments: number;
  unpaidAppointments: number;
  averageRating: number;
  totalReviews: number;
}

export interface EarningsHistoryItem {
  appointmentId: string;
  patientName: string;
  date: string;
  startTime: string;
  amount: number;
  paymentStatus: string;
  appointmentStatus: string;
}

export interface EarningsHistory {
  earnings: EarningsHistoryItem[];
  totalForPeriod: number;
  periodLabel: string;
}

export interface MonthlyChartItem {
  month: string;
  year: number;
  earnings: number;
}

export const earningsApi = {
  getSummary: async (): Promise<EarningsSummary> => {
    const res = await client.get<ApiResponse<EarningsSummary>>("/earnings/summary");
    return res.data.data;
  },

  getHistory: async (month: number, year: number): Promise<EarningsHistory> => {
    const res = await client.get<ApiResponse<EarningsHistory>>("/earnings/history", {
      params: { month, year },
    });
    return res.data.data;
  },

  getMonthlyChart: async (): Promise<MonthlyChartItem[]> => {
    const res = await client.get<ApiResponse<MonthlyChartItem[]>>("/earnings/monthly-chart");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },
};
