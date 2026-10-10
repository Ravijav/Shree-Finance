"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Users,
  FileText,
  Phone,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DailyPayment {
  status: string;
  installmentAmount: number;
  dueDate: string;
  paidDate: string | null;
}

interface RDAccount {
  accountNumber: string;
  monthlyDeposit: number;
  totalDeposited: number;
}

interface Loan {
  id: string;
  loanCode: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureDays: number;
  totalDays: number;
  dailyInstallment: number;
  totalAmount: number;
  outstandingAmount: number;
  paidDays: number;
  status: string;
  disbursedAt: string | null;
  createdAt: string;
  emiPayments: DailyPayment[];
  rdAccount: RDAccount | null;
}

interface Customer {
  id: string;
  customerCode: string;
  aadharNumber: string | null;
  panNumber: string | null;
  address: string | null;
  createdAt: string;
  user: {
    name: string;
    phone: string;
    email: string;
    createdAt: string;
  };
  loans: Loan[];
}

interface ReportData {
  agent: {
    id: string;
    employeeCode: string;
    paymentType: string;
    salaryAmount: number | null;
    commissionRate: number | null;
    user: { name: string; email: string; phone: string };
  };
  customers: Customer[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-600",
  DEFAULTED: "bg-red-100 text-red-700",
};

export default function AgentReportPage() {
  const params = useParams();
  const agentId = params.id as string;
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/agents/${agentId}/report`);
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error);
          return;
        }
        setData(json);
      } catch {
        toast.error("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { agent, customers } = data;

  const totalLoans = customers.reduce((sum, c) => sum + c.loans.length, 0);
  const activeLoans = customers.reduce(
    (sum, c) => sum + c.loans.filter((l) => l.status === "ACTIVE").length,
    0
  );
  const totalBusiness = customers.reduce(
    (sum, c) => sum + c.loans.reduce((s, l) => s + l.principalAmount, 0),
    0
  );
  const totalOutstanding = customers.reduce(
    (sum, c) => sum + c.loans.reduce((s, l) => s + l.outstandingAmount, 0),
    0
  );
  const totalCollected = customers.reduce(
    (sum, c) =>
      sum +
      c.loans.reduce(
        (s, l) =>
          s +
          l.emiPayments
            .filter((e) => e.status === "PAID")
            .reduce((es, e) => es + e.installmentAmount, 0), // ← changed
        0
      ),
    0
  );

  return (
    <div className="space-y-6">

      {/* Back */}
      <Link
        href="/admin/agents"
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Agents
      </Link>

      {/* Agent Header */}
      <Card className="border-slate-200 bg-slate-900 text-white">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{agent.user.name}</h2>
              <p className="text-slate-400 text-sm">
                Employee Code: {agent.employeeCode}
              </p>
              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <Phone className="h-3 w-3" />
                {agent.user.phone}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className="bg-blue-500 text-white hover:bg-blue-500">
                {agent.paymentType}
              </Badge>
              <p className="text-slate-300 text-sm">
                {agent.paymentType === "SALARY"
                  ? agent.salaryAmount
                    ? formatCurrency(agent.salaryAmount) + " / month"
                    : "-"
                  : agent.commissionRate
                  ? `${agent.commissionRate}% commission`
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Customers", value: customers.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Loans", value: totalLoans, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Active Loans", value: activeLoans, icon: FileText, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Business", value: formatCurrency(totalBusiness), icon: IndianRupee, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Total Collected", value: formatCurrency(totalCollected), icon: IndianRupee, color: "text-teal-600", bg: "bg-teal-50" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-600">
                  {stat.label}
                </CardTitle>
                <div className={`${stat.bg} p-1.5 rounded-lg`}>
                  <Icon className={`h-3 w-3 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-lg font-bold ${stat.color}`}>
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Report Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Account Report — {customers.length} Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No customers added by this agent yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left py-3 px-3 font-medium rounded-tl-lg">S.No</th>
                    <th className="text-left py-3 px-3 font-medium">CIF</th>
                    <th className="text-left py-3 px-3 font-medium">Name</th>
                    <th className="text-left py-3 px-3 font-medium">Phone</th>
                    <th className="text-left py-3 px-3 font-medium">A/C No</th>
                    <th className="text-left py-3 px-3 font-medium">Product</th>
                    <th className="text-left py-3 px-3 font-medium">Plan (Days)</th>
                    <th className="text-left py-3 px-3 font-medium">Disbursed</th>
                    <th className="text-left py-3 px-3 font-medium">Daily Collection</th>
                    <th className="text-left py-3 px-3 font-medium">Collected Today</th>
                    <th className="text-left py-3 px-3 font-medium">Total Collected</th>
                    <th className="text-left py-3 px-3 font-medium rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, customerIndex) => {
                    if (customer.loans.length === 0) {
                      return (
                        <tr
                          key={customer.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="py-3 px-3 text-slate-500">
                            {customerIndex + 1}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-xs">
                            {customer.customerCode}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-medium text-slate-800">
                              {customer.user.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              Joined {formatDate(customer.createdAt)}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {customer.user.phone}
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs">
                            No loans
                          </td>
                          <td colSpan={8} className="py-3 px-3 text-slate-400 text-xs">
                            —
                          </td>
                        </tr>
                      );
                    }

                    return customer.loans.map((loan, loanIndex) => {
                      // Collected today
                      const today = new Date().toDateString();
                      const collectedToday = loan.emiPayments
                        .filter((e) => {
                          if (e.status !== "PAID") return false;
                          return (
                            new Date(e.paidDate!).toDateString() === today
                          );
                        })
                        .reduce((sum, e) => sum + e.installmentAmount, 0);

                      // Total collected for this loan
                      const totalCollectedForLoan = loan.emiPayments
                        .filter((e) => e.status === "PAID")
                        .reduce((sum, e) => sum + e.installmentAmount, 0);

                      return (
                        <tr
                          key={loan.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 ${
                            loanIndex % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          }`}
                        >
                          <td className="py-3 px-3 text-slate-500">
                            {loanIndex === 0 ? customerIndex + 1 : ""}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-xs">
                            {loanIndex === 0 ? customer.customerCode : ""}
                          </td>
                          <td className="py-3 px-3">
                            {loanIndex === 0 && (
                              <div>
                                <p className="font-medium text-slate-800">
                                  {customer.user.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatDate(customer.createdAt)}
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-xs">
                            {loanIndex === 0 ? customer.user.phone : ""}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-xs">
                            {loan.rdAccount
                              ? loan.rdAccount.accountNumber
                              : loan.loanCode}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="outline" className="text-xs">
                              {loan.loanType}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-xs">
                            {loan.totalDays} days
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium text-xs">
                            {formatDate(loan.disbursedAt ?? loan.createdAt)}
                          </td>
                          <td className="py-3 px-3 text-green-600 font-medium text-xs">
                            {formatCurrency(loan.dailyInstallment)}
                          </td>
                          <td className="py-3 px-3 text-xs">
                            {collectedToday > 0 ? (
                              <span className="text-green-600 font-medium">
                                {formatCurrency(collectedToday)}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium text-xs">
                            {formatCurrency(totalCollectedForLoan)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              className={`${statusColors[loan.status]} hover:${statusColors[loan.status]} text-xs`}
                            >
                              {loan.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>

                {/* Totals Row */}
                <tfoot>
                  <tr className="bg-slate-900 text-white">
                    <td colSpan={8} className="py-3 px-3 font-semibold rounded-bl-lg">
                      Total
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs">—</td>
                    <td className="py-3 px-3 font-semibold text-xs">—</td>
                    <td className="py-3 px-3 font-semibold text-xs">
                      {formatCurrency(totalCollected)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-xs rounded-br-lg">
                      {formatCurrency(totalOutstanding)} outstanding
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}