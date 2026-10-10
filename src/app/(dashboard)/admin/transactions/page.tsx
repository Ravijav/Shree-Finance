"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  XCircle,
  TrendingUp,
  IndianRupee,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  transactionCode: string;
  type: string;
  status: string;
  amount: number;
  outstandingBefore: number;
  outstandingAfter: number;
  remarks: string | null;
  createdAt: string;
  customer: {
    user: { name: string; phone: string };
  };
  agent: {
    user: { name: string };
  };
  loan: {
    loanCode: string;
    loanType: string;
    principalAmount: number;
  } | null;
  rdAccount: {
    accountNumber: string;
    planYears: number;
    interestRate: number;
  } | null;
}

interface TransactionData {
  transactions: Transaction[];
  summary: {
    totalTransactions: number;
    totalDisbursed: number;
    totalCollected: number;
    totalReverted: number;
    totalRDDeposited: number;
    netFlow: number;
  };
}

const loanTypeColors: Record<string, string> = {
  LOAN_DISBURSED: "bg-blue-100 text-blue-700",
  EMI_SUBMITTED: "bg-amber-100 text-amber-700",
  EMI_APPROVED: "bg-green-100 text-green-700",
  EMI_REVERTED: "bg-red-100 text-red-700",
  LOAN_CLOSED: "bg-slate-100 text-slate-700",
};

const rdTypeColors: Record<string, string> = {
  RD_ACCOUNT_OPENED: "bg-blue-100 text-blue-700",
  RD_PAYMENT_SUBMITTED: "bg-amber-100 text-amber-700",
  RD_PAYMENT_APPROVED: "bg-green-100 text-green-700",
  RD_PAYMENT_REVERTED: "bg-red-100 text-red-700",
  RD_MATURED: "bg-purple-100 text-purple-700",
};

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState<"LOAN" | "RD">("LOAN");
  const [data, setData] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadTransactions = async (
    source: string,
    type?: string,
    from?: string,
    to?: string
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("source", source);
      if (type && type !== "ALL") params.append("type", type);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const res = await fetch(
        `/api/admin/transactions?${params.toString()}`
      );
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error);
        return;
      }
      setData(json);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadTransactions(activeTab);
    };
    load();
    
  }, [activeTab]);

  const handleFilter = async () => {
    await loadTransactions(activeTab, typeFilter, fromDate, toDate);
  };

  const handleClear = async () => {
    setTypeFilter("ALL");
    setFromDate("");
    setToDate("");
    await loadTransactions(activeTab);
  };

  const typeColors =
    activeTab === "LOAN" ? loanTypeColors : rdTypeColors;

  const loanTypeOptions = [
    { value: "ALL", label: "All Types" },
    { value: "LOAN_DISBURSED", label: "Loan Disbursed" },
    { value: "EMI_SUBMITTED", label: "EMI Submitted" },
    { value: "EMI_APPROVED", label: "EMI Approved" },
    { value: "EMI_REVERTED", label: "EMI Reverted" },
    { value: "LOAN_CLOSED", label: "Loan Closed" },
  ];

  const rdTypeOptions = [
    { value: "ALL", label: "All Types" },
    { value: "RD_ACCOUNT_OPENED", label: "Account Opened" },
    { value: "RD_PAYMENT_SUBMITTED", label: "Payment Submitted" },
    { value: "RD_PAYMENT_APPROVED", label: "Payment Approved" },
    { value: "RD_PAYMENT_REVERTED", label: "Payment Reverted" },
    { value: "RD_MATURED", label: "Account Matured" },
  ];

  const typeOptions =
    activeTab === "LOAN" ? loanTypeOptions : rdTypeOptions;

  const handleTabChange = (tab: "LOAN" | "RD") => {
  setActiveTab(tab);
  setTypeFilter("ALL"); // Reset the filter here instead!
};

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Transaction Ledger
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Complete immutable record of all financial transactions
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() =>handleTabChange("LOAN")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "LOAN"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <IndianRupee className="h-4 w-4" />
          Loan Transactions
        </button>
        <button
          onClick={() =>handleTabChange("RD")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "RD"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          RD Transactions
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {activeTab === "LOAN" ? (
            <>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total Disbursed</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(data.summary.totalDisbursed)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total Collected</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(data.summary.totalCollected)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total Reverted</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(data.summary.totalReverted)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Net Flow</p>
                  <p
                    className={`text-lg font-bold ${
                      data.summary.netFlow >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(data.summary.netFlow)}
                  </p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total Transactions</p>
                  <p className="text-lg font-bold text-blue-600">
                    {data.summary.totalTransactions}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total RD Deposited</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(data.summary.totalRDDeposited)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Total Reverted</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(data.summary.totalReverted)}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-4">
                  <p className="text-xs text-slate-500">Net RD Collected</p>
                  <p className="text-lg font-bold text-teal-600">
                    {formatCurrency(
                      data.summary.totalRDDeposited -
                        data.summary.totalReverted
                    )}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              onClick={handleFilter}
              className="bg-slate-900 hover:bg-slate-700"
            >
              Apply Filter
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            {activeTab === "LOAN" ? (
              <IndianRupee className="h-4 w-4" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            {activeTab === "LOAN" ? "Loan" : "RD"} Transactions (
            {data?.transactions.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : !data || data.transactions.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No transactions yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Txn Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      {activeTab === "LOAN" ? "Loan" : "RD Account"}
                    </th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Before</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">After</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-3 px-2 font-mono text-xs text-slate-600">
                        {txn.transactionCode}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`${
                            typeColors[txn.type] ?? "bg-slate-100 text-slate-700"
                          } hover:${
                            typeColors[txn.type] ?? "bg-slate-100 text-slate-700"
                          } text-xs`}
                        >
                          {txn.type.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-800">
                          {txn.customer.user.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {txn.customer.user.phone}
                        </p>
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {txn.agent.user.name}
                      </td>
                      <td className="py-3 px-2">
                        {activeTab === "LOAN" && txn.loan ? (
                          <div>
                            <p className="font-mono text-xs text-slate-600">
                              {txn.loan.loanCode}
                            </p>
                            <p className="text-xs text-slate-400">
                              {txn.loan.loanType}
                            </p>
                          </div>
                        ) : txn.rdAccount ? (
                          <div>
                            <p className="font-mono text-xs text-slate-600">
                              {txn.rdAccount.accountNumber}
                            </p>
                            <p className="text-xs text-slate-400">
                              {txn.rdAccount.planYears}yr @{" "}
                              {txn.rdAccount.interestRate}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-800">
                        {txn.amount > 0 ? formatCurrency(txn.amount) : "—"}
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">
                        {formatCurrency(txn.outstandingBefore)}
                      </td>
                      <td className="py-3 px-2 text-slate-600 text-xs">
                        {formatCurrency(txn.outstandingAfter)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={
                            txn.status === "SUCCESS"
                              ? "bg-green-100 text-green-700 hover:bg-green-100"
                              : txn.status === "PENDING"
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                          }
                        >
                          {txn.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-500 text-xs">
                        {formatDate(txn.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}