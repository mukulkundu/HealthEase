import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { earningsApi } from "../../api/earnings.api";
import type { EarningsSummary, EarningsHistory, MonthlyChartItem } from "../../api/earnings.api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import type { AppointmentStatus } from "../../types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
  NO_SHOW: "bg-gray-50 text-gray-600 border-gray-200",
};

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function to12h(t: string) {
  try {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
  } catch {
    return t;
  }
}

export default function EarningsPage() {
  const now = new Date();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [chart, setChart] = useState<MonthlyChartItem[]>([]);
  const [history, setHistory] = useState<EarningsHistory | null>(null);
  const [historyMonth, setHistoryMonth] = useState(now.getMonth() + 1);
  const [historyYear, setHistoryYear] = useState(now.getFullYear());
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    Promise.all([earningsApi.getSummary(), earningsApi.getMonthlyChart()])
      .then(([s, c]) => {
        setSummary(s);
        setChart(Array.isArray(c) ? c : []);
      })
      .catch(() => toast.error("Failed to load earnings"))
      .finally(() => setLoadingSummary(false));
  }, []);

  useEffect(() => {
    setLoadingHistory(true);
    earningsApi
      .getHistory(historyMonth, historyYear)
      .then(setHistory)
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoadingHistory(false));
  }, [historyMonth, historyYear]);

  const prevMonth = () => {
    if (historyMonth === 1) {
      setHistoryMonth(12);
      setHistoryYear((y) => y - 1);
    } else {
      setHistoryMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    const nextM = historyMonth === 12 ? 1 : historyMonth + 1;
    const nextY = historyMonth === 12 ? historyYear + 1 : historyYear;
    // Don't go into the future
    if (
      nextY > now.getFullYear() ||
      (nextY === now.getFullYear() && nextM > now.getMonth() + 1)
    )
      return;
    setHistoryMonth(nextM);
    setHistoryYear(nextY);
  };

  const isCurrentMonth =
    historyMonth === now.getMonth() + 1 && historyYear === now.getFullYear();

  const monthPctChange =
    summary && summary.lastMonthEarnings > 0
      ? (((summary.thisMonthEarnings - summary.lastMonthEarnings) /
          summary.lastMonthEarnings) *
          100).toFixed(1)
      : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-500 mt-1">Track your income and payment history</p>
        </div>

        {loadingSummary ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-8">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading earnings...
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <IndianRupee className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-xs text-gray-500">All time</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(summary?.totalEarnings ?? 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Earnings</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    {monthPctChange !== null && (
                      <span
                        className={`text-xs font-medium flex items-center gap-0.5 ${
                          Number(monthPctChange) >= 0 ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {Number(monthPctChange) >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(Number(monthPctChange))}%
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(summary?.thisMonthEarnings ?? 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">This Month</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{(summary?.thisWeekEarnings ?? 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">This Week</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                      <CalendarCheck className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {summary?.totalAppointments ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Appointments</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {summary?.paidAppointments ?? 0} paid, {summary?.unpaidAppointments ?? 0} unpaid
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly chart */}
            {chart.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chart} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v}`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toFixed(0)}`, "Earnings"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          fontSize: "13px",
                        }}
                      />
                      <Bar dataKey="earnings" fill="#2563eb" radius={[4, 4, 0, 0]}>
                        <LabelList
                          dataKey="earnings"
                          position="top"
                          formatter={(v: number) => (v > 0 ? `₹${v.toFixed(0)}` : "")}
                          style={{ fontSize: "10px", fill: "#6b7280" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Transaction history */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">Transaction History</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                      {MONTH_NAMES[historyMonth - 1]} {historyYear}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextMonth}
                      disabled={isCurrentMonth}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : (
                  <>
                    {history && history.totalForPeriod > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100">
                        <p className="text-sm text-green-800 font-medium">
                          Total for {history.periodLabel}:{" "}
                          <span className="font-bold">₹{history.totalForPeriod.toFixed(0)}</span>
                        </p>
                      </div>
                    )}

                    {!history || history.earnings.length === 0 ? (
                      <div className="py-10 text-center">
                        <IndianRupee className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No transactions for this period</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {history.earnings.map((item) => (
                          <div
                            key={item.appointmentId}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-gray-900">
                                {item.patientName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(item.date)} &bull; {to12h(item.startTime)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  statusStyles[item.appointmentStatus as AppointmentStatus] ??
                                  "bg-gray-50 text-gray-600 border-gray-200"
                                }`}
                              >
                                {item.appointmentStatus}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${
                                  item.paymentStatus === "PAID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-gray-50 text-gray-500 border-gray-200"
                                }`}
                              >
                                {item.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                              </Badge>
                              <span className="text-sm font-semibold text-gray-900 min-w-[56px] text-right">
                                ₹{item.amount.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
