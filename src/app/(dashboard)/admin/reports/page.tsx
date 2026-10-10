"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface ReportData {
  summary: {
    totalLoans: number;
    activeLoans: number;
    closedLoans: number;
    defaultedLoans: number;
    totalDisbursed: number;
    totalToCollect: number;
    totalOutstanding: number;
    totalCollected: number;
    totalProfit: number;
    overdueEMIs: number;
    pendingEMIs: number;
    totalPrincipalDisbursed: number;   // ← add
    totalInterestExpected: number;      // ← add
    totalCollectedAmount: number;       // ← add
    interestCollected: number;          // ← add
    principalCollected: number;         // ← add
    totalOutstandingAmount: number;     // ← add
  };
  loansByType: {
    loanType: string;
    _count: { id: number };
    _sum: { principalAmount: number };
  }[];
  agentPerformance: {
    id: string;
    user: { name: string };
    paymentType: string;
    salaryAmount: number | null;
    commissionRate: number | null;
    _count: { customers: number; loans: number };
    loans: { principalAmount: number; status: string }[];
  }[];
  monthlyDisbursement: { month: string; total: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/reports");
        const json = await res.json();
        setData(json);
      } catch {
        toast.error("Failed to load report data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { summary } = data;

  const summaryCards = [
    {
      label: "Total Disbursed",
      value: formatCurrency(summary.totalDisbursed),
      icon: IndianRupee,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Collected",
      value: formatCurrency(summary.totalCollected),
      icon: CheckCircle2,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Total Outstanding",
      value: formatCurrency(summary.totalOutstanding),
      icon: TrendingDown,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Net Profit",
      value: formatCurrency(summary.totalProfit),
      icon: TrendingUp,
      color: summary.totalProfit >= 0 ? "text-green-600" : "text-red-600",
      bg: summary.totalProfit >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Total Loans",
      value: summary.totalLoans,
      icon: FileText,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Overdue EMIs",
      value: summary.overdueEMIs,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">
          Financial overview of Sree Shyam Financial Services
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {card.label}
                </CardTitle>
                <div className={`${card.bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
            
          );
        })}
      </div>
      {/* Collection Breakdown */}
      <Card className="border-slate-200 col-span-full">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">
            Collection Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-1 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">
                Total Disbursed
              </p>
              <p className="text-2xl font-bold text-blue-700">
                {formatCurrency(data.summary.totalPrincipalDisbursed ?? 0)}
              </p>
              <p className="text-xs text-blue-500">Principal given to customers</p>
            </div>
            <div className="space-y-1 p-4 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">
                Interest Expected
              </p>
              <p className="text-2xl font-bold text-amber-700">
                {formatCurrency(data.summary.totalInterestExpected ?? 0)}
              </p>
              <p className="text-xs text-amber-500">Total interest on all loans</p>
            </div>
            <div className="space-y-1 p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-green-600 font-medium uppercase tracking-wide">
                Principal Collected
              </p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(data.summary.principalCollected ?? 0)}
              </p>
              <p className="text-xs text-green-500">Principal recovered so far</p>
            </div>
            <div className="space-y-1 p-4 bg-teal-50 rounded-lg">
              <p className="text-xs text-teal-600 font-medium uppercase tracking-wide">
                Interest Collected
              </p>
              <p className="text-2xl font-bold text-teal-700">
                {formatCurrency(data.summary.interestCollected ?? 0)}
              </p>
              <p className="text-xs text-teal-500">Profit earned so far</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Principal Recovery</span>
                <span>
                  {data.summary.totalPrincipalDisbursed > 0
                    ? Math.round(
                        (data.summary.principalCollected /
                          data.summary.totalPrincipalDisbursed) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      data.summary.totalPrincipalDisbursed > 0
                        ? Math.min(
                            (data.summary.principalCollected /
                              data.summary.totalPrincipalDisbursed) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Interest Recovery</span>
                <span>
                  {data.summary.totalInterestExpected > 0
                    ? Math.round(
                        (data.summary.interestCollected /
                          data.summary.totalInterestExpected) *
                          100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-teal-500 h-3 rounded-full transition-all"
                  style={{
                    width: `${
                      data.summary.totalInterestExpected > 0
                        ? Math.min(
                            (data.summary.interestCollected /
                              data.summary.totalInterestExpected) *
                              100,
                            100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loan Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Loan Status */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">
              Loan Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Active", value: summary.activeLoans, color: "bg-green-500" },
              { label: "Closed", value: summary.closedLoans, color: "bg-slate-400" },
              { label: "Defaulted", value: summary.defaultedLoans, color: "bg-red-500" },
              {
                label: "Pending",
                value: summary.totalLoans - summary.activeLoans - summary.closedLoans - summary.defaultedLoans,
                color: "bg-amber-500",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-slate-600 flex-1">{item.label}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {item.value}
                </span>
                <span className="text-xs text-slate-400 w-12 text-right">
                  {summary.totalLoans > 0
                    ? `${Math.round((item.value / summary.totalLoans) * 100)}%`
                    : "0%"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Loans by Type */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">
              Loans by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.loansByType.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">
                No loans yet
              </p>
            ) : (
              data.loansByType.map((item) => (
                <div key={item.loanType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.loanType}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      {item._count.id} loan{item._count.id > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    {formatCurrency(item._sum.principalAmount ?? 0)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agent Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.agentPerformance.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              No agents yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Payment Type</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customers</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Total Loans</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Active Loans</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Total Business</th>
                  </tr>
                </thead>
                <tbody>
                  {data.agentPerformance.map((agent) => {
                    const activeLoansCount = agent.loans.filter(
                      (l) => l.status === "ACTIVE"
                    ).length;
                    const totalBusiness = agent.loans.reduce(
                      (sum, l) => sum + l.principalAmount,
                      0
                    );
                    return (
                      <tr
                        key={agent.id}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="py-3 px-2 font-medium text-slate-800">
                          {agent.user.name}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant="outline" className="text-xs">
                            {agent.paymentType}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {agent.paymentType === "SALARY"
                            ? agent.salaryAmount
                              ? formatCurrency(agent.salaryAmount)
                              : "-"
                            : agent.commissionRate
                            ? `${agent.commissionRate}%`
                            : "-"}
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {agent._count.customers}
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {agent._count.loans}
                        </td>
                        <td className="py-3 px-2 text-slate-600">
                          {activeLoansCount}
                        </td>
                        <td className="py-3 px-2 font-medium text-slate-800">
                          {formatCurrency(totalBusiness)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Disbursement */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">
            Monthly Disbursement (Last 6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthlyDisbursement.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              No disbursement data yet
            </p>
          ) : (
            <div className="space-y-3">
              {data.monthlyDisbursement.map((item) => {
                const maxTotal = Math.max(
                  ...data.monthlyDisbursement.map((m) => Number(m.total))
                );
                const percentage = maxTotal > 0
                  ? (Number(item.total) / maxTotal) * 100
                  : 0;
                return (
                  <div key={item.month} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 w-24">{item.month}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-slate-800 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-28 text-right">
                      {formatCurrency(Number(item.total))}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}