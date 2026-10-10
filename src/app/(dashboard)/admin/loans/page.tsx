
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency } from "@/lib/utils";

interface DailyPayment {
  id: string;
  dayNumber: number;
  dueDate: string;
  paidDate: string | null;
  installmentAmount: number;
  status: string;
  paidByAgentId: string | null;
  remarks: string | null;
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
  outstandingAmount: number;
  paidDays: number;
  status: string;
  createdAt: string;
  disbursedAt: string | null;
  customer: {
    customerCode: string;
    user: { name: string; phone: string };
  };
  agent: {
    user: { name: string };
  };
  emiPayments: DailyPayment[];
}

interface LoanDetail extends Loan {
  rdAccount: { accountNumber: string } | null;
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-600",
  DEFAULTED: "bg-red-100 text-red-700",
};

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filtered, setFiltered] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selectedLoan, setSelectedLoan] = useState<LoanDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<DailyPayment | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [reverting, setReverting] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [deductions, setDeductions] = useState<{
  id: string;
  amount: number;
  status: string;
  reason: string;
  createdAt: string;
  rdAccount: { accountNumber: string; totalDeposited: number };
  loan: { loanCode: string };
  emiPayment: { dayNumber: number; installmentAmount: number; dueDate: string };
  customer?: { user: { name: string; phone: string } };
  agent?: { user: { name: string } };
  }[]>([]);
  const [processingDeduction, setProcessingDeduction] = useState<string | null>(null);

  const loadLoans = async (status?: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.append("status", status);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const res = await fetch(`/api/admin/loans?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to fetch loans");
        setLoans([]);
        setFiltered([]);
        return;
      }
      setLoans(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch loans");
      setLoans([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const load = async () => {
      await loadLoans();
      try {
        const res = await fetch("/api/admin/rd-deductions");
        const data = await res.json();
        setDeductions(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load RD deductions");
      }
    };
    load();
  }, []);

  useEffect(() => {
    const applySearch = () => {
      if (!search.trim()) {
        setFiltered(loans);
        return;
      }
      const q = search.toLowerCase();
      setFiltered(
        loans.filter(
          (l) =>
            l.loanCode.toLowerCase().includes(q) ||
            l.customer.user.name.toLowerCase().includes(q) ||
            l.customer.user.phone.includes(q) ||
            l.agent.user.name.toLowerCase().includes(q)
        )
      );
    };
    applySearch();
  }, [search, loans]);

  const handleFilter = async () => {
    await loadLoans(statusFilter, fromDate, toDate);
  };

  const handleClear = async () => {
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setSearch("");
    await loadLoans();
  };

  const getPaidDays = (payments: Loan["emiPayments"]) =>
    payments.filter((e) => e.status === "PAID").length;

  const getPendingApproval = (payments: Loan["emiPayments"]) =>
    payments.filter((e) => e.status === "PENDING_APPROVAL").length;

  const handleViewLoan = async (loanId: string) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`/api/admin/loans/${loanId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load loan details");
        setDetailOpen(false);
        return;
      }
      setSelectedLoan(data);
    } catch {
      toast.error("Failed to load loan details");
      setDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleApprovePayment = async (payment: DailyPayment) => {
    if (!selectedLoan) return;
    try {
      const res = await fetch(
        `/api/admin/loans/${selectedLoan.id}/approve-emi`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emiPaymentId: payment.id }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Daily collection approved!");
      await handleViewLoan(selectedLoan.id);
      await loadLoans(statusFilter, fromDate, toDate);
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleRevertPayment = async () => {
    if (!selectedLoan || !selectedPayment || !revertReason.trim()) {
      toast.error("Please provide a reason for reverting");
      return;
    }
    setReverting(true);
    try {
      const res = await fetch(
        `/api/admin/loans/${selectedLoan.id}/revert-emi`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emiPaymentId: selectedPayment.id,
            reason: revertReason,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Daily collection reverted successfully");
      setRevertOpen(false);
      setRevertReason("");
      await handleViewLoan(selectedLoan.id);
      await loadLoans(statusFilter, fromDate, toDate);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReverting(false);
    }
  };

  const handleDeductionAction = async (deductionId: string, action: "APPROVE" | "REJECT") => {
    setProcessingDeduction(deductionId);
    try {
      const res = await fetch(`/api/admin/rd-deductions/${deductionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(action === "APPROVE" ? "Deduction approved — EMI marked paid!" : "Deduction rejected");
      // Refresh both
      await loadLoans(statusFilter, fromDate, toDate);
      const res2 = await fetch("/api/admin/rd-deductions");
      const data2 = await res2.json();
      setDeductions(Array.isArray(data2) ? data2 : []);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setProcessingDeduction(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Loans</h2>
        <p className="text-sm text-slate-500 mt-1">
          View and monitor all loans
        </p>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-48 space-y-1">
              <Label className="text-xs text-slate-500">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by loan code, customer, agent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="DEFAULTED">Defaulted</SelectItem>
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

      {/* Loans Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Loans ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No loans found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Loan Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Principal</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Daily</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Days Paid</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Pending Approval</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Outstanding</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Created</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-3 px-2 font-mono text-slate-700">
                        {loan.loanCode}
                      </td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-slate-800">
                            {loan.customer.user.name}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {loan.customer.user.phone}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {loan.agent.user.name}
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-xs">
                          {loan.loanType}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-700 font-medium">
                        {formatCurrency(loan.principalAmount)}
                      </td>
                      <td className="py-3 px-2 text-green-600 font-medium">
                        {formatCurrency(loan.dailyInstallment)}
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        {getPaidDays(loan.emiPayments)}/{loan.totalDays}
                      </td>
                      <td className="py-3 px-2">
                        {getPendingApproval(loan.emiPayments) > 0 ? (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                            {getPendingApproval(loan.emiPayments)} pending
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-slate-700 font-medium">
                        {formatCurrency(loan.outstandingAmount)}
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          className={`${statusColors[loan.status]} hover:${statusColors[loan.status]}`}
                        >
                          {loan.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {formatDate(loan.createdAt)}
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleViewLoan(loan.id)}
                        >
                          View Days
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Loan Details — {selectedLoan?.loanCode}
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : selectedLoan ? (
            <div className="space-y-4">

              {/* Loan Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg text-sm">
                <div>
                  <p className="text-slate-400 text-xs">Customer</p>
                  <p className="font-medium text-slate-800">
                    {selectedLoan.customer.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Principal</p>
                  <p className="font-medium text-slate-800">
                    {formatCurrency(selectedLoan.principalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Outstanding</p>
                  <p className="font-medium text-amber-600">
                    {formatCurrency(selectedLoan.outstandingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Daily Collection</p>
                  <p className="font-medium text-green-600">
                    {formatCurrency(selectedLoan.dailyInstallment)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Interest Rate</p>
                  <p className="font-medium text-slate-800">
                    {selectedLoan.interestRate}% p.a.
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Days Progress</p>
                  <p className="font-medium text-slate-800">
                    {selectedLoan.paidDays} / {selectedLoan.totalDays} days
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Status</p>
                  <Badge
                    className={`${statusColors[selectedLoan.status]} hover:${statusColors[selectedLoan.status]}`}
                  >
                    {selectedLoan.status}
                  </Badge>
                </div>
                {selectedLoan.rdAccount && (
                  <div>
                    <p className="text-slate-400 text-xs">RD Account</p>
                    <p className="font-medium text-purple-600">
                      {selectedLoan.rdAccount.accountNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Daily Collection Schedule */}
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">
                  Daily Collection Schedule
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedLoan.emiPayments?.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        {payment.status === "PAID" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : payment.status === "PENDING_APPROVAL" ? (
                          <Clock className="h-4 w-4 text-amber-500" />
                        ) : payment.status === "OVERDUE" ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-slate-300" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            Day #{payment.dayNumber}
                          </p>
                          <p className="text-xs text-slate-400">
                            Due: {formatDate(payment.dueDate)}
                            {payment.paidDate &&
                              ` · Paid: ${formatDate(payment.paidDate)}`}
                          </p>
                          {payment.remarks && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              {payment.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">
                          {formatCurrency(payment.installmentAmount)}
                        </span>
                        {payment.status === "PENDING_APPROVAL" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovePayment(payment)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 hover:text-red-700 hover:border-red-300"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRevertOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {payment.status === "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-orange-500 hover:text-orange-700 hover:border-orange-300"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setRevertOpen(true);
                        }}
                      >
                        Revert
                      </Button>
                    )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Revert Payment Dialog */}
      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            {/* <DialogTitle className="text-red-600">
              Revert Daily Collection
            </DialogTitle> */}
            <DialogTitle className={selectedPayment?.status === "PENDING_APPROVAL" ? "text-red-600" : "text-orange-600"}>
              {selectedPayment?.status === "PENDING_APPROVAL"
                ? "Reject Payment"
                : "Revert Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {selectedPayment?.status === "PENDING_APPROVAL"
                ? `Rejecting Day #${selectedPayment?.dayNumber} payment of ${selectedPayment ? formatCurrency(selectedPayment.installmentAmount) : ""}. The EMI will go back to PENDING.`
                : `Reverting Day #${selectedPayment?.dayNumber} payment of ${selectedPayment ? formatCurrency(selectedPayment.installmentAmount) : ""}. This will restore the outstanding balance.`
              }
            </div>
            <div className="space-y-2">
              <Label>Reason for Reverting *</Label>
              <Textarea
                placeholder="Enter reason (e.g. Agent marked by mistake)"
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRevertOpen(false);
                  setRevertReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleRevertPayment}
                disabled={reverting || !revertReason.trim()}
              >
                {reverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedPayment?.status === "PENDING_APPROVAL" ? (
                  "Reject Payment"
                ) : (
                  "Revert Payment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
                {/* RD Deduction Requests */}
          {deductions.filter((d) => d.status === "PENDING").length > 0 && (
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {deductions.filter((d) => d.status === "PENDING").length} pending
                  </span>
                  RD Deduction Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deductions
                    .filter((d) => d.status === "PENDING")
                    .map((deduction) => (
                      <div
                        key={deduction.id}
                        className="flex items-start justify-between p-3 rounded-lg border border-purple-100 bg-purple-50"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-800">
                            {deduction.customer?.user.name}{" "}
                            <span className="text-slate-400 text-xs">
                              · {deduction.customer?.user.phone}
                            </span>
                          </p>
                          <p className="text-xs text-slate-600">
                            Loan: {deduction.loan.loanCode} · Day #{deduction.emiPayment.dayNumber} ·{" "}
                            {formatCurrency(deduction.emiPayment.installmentAmount)}
                          </p>
                          <p className="text-xs text-slate-600">
                            RD Account: {deduction.rdAccount.accountNumber} · Balance:{" "}
                            {formatCurrency(deduction.rdAccount.totalDeposited)}
                          </p>
                          <p className="text-xs text-slate-500 italic">
                            Reason: {deduction.reason}
                          </p>
                          <p className="text-xs text-slate-400">
                            Agent: {deduction.agent?.user.name} · {formatDate(deduction.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700 w-20"
                            onClick={() => handleDeductionAction(deduction.id, "APPROVE")}
                            disabled={processingDeduction === deduction.id}
                          >
                            {processingDeduction === deduction.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Approve"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-500 hover:text-red-700 hover:border-red-300 w-20"
                            onClick={() => handleDeductionAction(deduction.id, "REJECT")}
                            disabled={processingDeduction === deduction.id}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

    </div>
  );
}