"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate, calculateRDAccount } from "@/lib/utils";

interface RDPayment {
  id: string;
  monthNumber: number;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: string;
}

interface RDAccount {
  id: string;
  accountNumber: string;
  planYears: number;
  interestRate: number;
  interestPayableOn: string;
  monthlyDeposit: number;
  openingDeposit: number;
  totalDeposited: number;
  totalMonths: number;
  paidMonths: number;
  totalPrincipal: number;
  interestAmount: number;
  maturityAmount: number;
  monthlyInterest: number;
  quarterlyInterest: number;
  openedAt: string;
  maturityDate: string;
  status: string;
  customer: {
    id: string;
    customerCode: string;
    user: { name: string; phone: string };
  };
  payments: RDPayment[];
}

interface Customer {
  id: string;
  customerCode: string;
  user: { name: string; phone: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MATURED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
  PREMATURE: "bg-red-100 text-red-700",
};

const planOptions = [
  { value: "1", label: "1 Year — 5.2% p.a." },
  { value: "2", label: "2 Years — 9% p.a." },
  { value: "3", label: "3 Years — 10% p.a." },
  { value: "4", label: "4 Years — 10.5% p.a." },
  { value: "5", label: "5 Years — 11% p.a." },
];

export default function AgentRDAccountsPage() {
  const [rdAccounts, setRdAccounts] = useState<RDAccount[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [markingPayment, setMarkingPayment] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerId: "",
    planYears: "",
    monthlyDeposit: "",
    openingDeposit: "",
    interestPayableOn: "MATURITY",
  });

  // RD Preview
  const preview =
    form.monthlyDeposit && form.planYears
      ? calculateRDAccount(
          Number(form.monthlyDeposit),
          Number(form.planYears)
        )
      : null;

  const loadRDAccounts = async () => {
    try {
      const res = await fetch("/api/agent/rd-accounts");
      const data = await res.json();
      setRdAccounts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch RD accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadRDAccounts();
      try {
        const res = await fetch("/api/agent/customers");
        const data = await res.json();
        setCustomers(data);
      } catch {
        toast.error("Failed to fetch customers");
      }
    };
    load();
  }, []);

  const handleOpenRDAccount = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/rd-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          planYears: Number(form.planYears),
          monthlyDeposit: Number(form.monthlyDeposit),
          openingDeposit: Number(form.openingDeposit || 0),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(`RD Account opened! A/C: ${data.accountNumber}`);
      setAddOpen(false);
      setForm({
        customerId: "",
        planYears: "",
        monthlyDeposit: "",
        openingDeposit: "",
        interestPayableOn: "MATURITY",
      });
      await loadRDAccounts();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (
    rdAccountId: string,
    paymentId: string
  ) => {
    setMarkingPayment(paymentId);
    try {
      const res = await fetch(
        `/api/agent/rd-accounts/${rdAccountId}/payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Payment submitted for approval!");
      await loadRDAccounts();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setMarkingPayment(null);
    }
  };

  const paymentStatusIcon = (status: string) => {
    if (status === "PAID")
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === "PENDING_APPROVAL")
      return <Clock className="h-4 w-4 text-amber-500" />;
    if (status === "OVERDUE")
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-slate-300" />;
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">RD Accounts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Open and manage recurring deposit accounts
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 gap-2">
              <Plus className="h-4 w-4" />
              Open RD Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Open New RD Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">

              {/* Customer */}
              <div className="space-y-2">
                <Label>Select Customer *</Label>
                <Select
                  value={form.customerId}
                  onValueChange={(v) => setForm({ ...form, customerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.user.name} — {c.customerCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <Label>Select Plan *</Label>
                <Select
                  value={form.planYears}
                  onValueChange={(v) => setForm({ ...form, planYears: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Monthly Deposit */}
              <div className="space-y-2">
                <Label>Monthly Deposit Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 1000"
                  value={form.monthlyDeposit}
                  onChange={(e) =>
                    setForm({ ...form, monthlyDeposit: e.target.value })
                  }
                />
              </div>

              {/* Opening Deposit */}
              <div className="space-y-2">
                <Label>Opening Deposit (₹)</Label>
                <Input
                  type="number"
                  placeholder="Amount paid today (optional)"
                  value={form.openingDeposit}
                  onChange={(e) =>
                    setForm({ ...form, openingDeposit: e.target.value })
                  }
                />
              </div>

              {/* Interest Payable On */}
              <div className="space-y-2">
                <Label>Interest Payable On *</Label>
                <Select
                  value={form.interestPayableOn}
                  onValueChange={(v) =>
                    setForm({ ...form, interestPayableOn: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATURITY">Maturity</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RD Preview */}
              {/* {preview && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    RD Account Summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Interest Rate</p>
                      <p className="font-semibold text-slate-800">
                        {preview.interestRate}% p.a.
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Months</p>
                      <p className="font-semibold text-slate-800">
                        {preview.totalMonths} months
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Principal</p>
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(preview.totalPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Interest</p>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(preview.interestAmount)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400 text-xs">Maturity Amount</p>
                      <p className="font-bold text-green-600 text-xl">
                        {formatCurrency(preview.maturityAmount)}
                      </p>
                    </div>
                    {form.interestPayableOn === "MONTHLY" && (
                      <div className="col-span-2">
                        <p className="text-slate-400 text-xs">Monthly Interest Payout</p>
                        <p className="font-semibold text-teal-600">
                          {formatCurrency(preview.monthlyInterest)}
                        </p>
                      </div>
                    )}
                    {form.interestPayableOn === "QUARTERLY" && (
                      <div className="col-span-2">
                        <p className="text-slate-400 text-xs">Quarterly Interest Payout</p>
                        <p className="font-semibold text-teal-600">
                          {formatCurrency(preview.quarterlyInterest)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )} */}
              {preview && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  RD Account Summary
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Interest Rate</p>
                    <p className="font-semibold text-slate-800">
                      {preview.interestRate}% p.a.
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Months</p>
                    <p className="font-semibold text-slate-800">
                      {preview.totalMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Principal</p>
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(preview.totalPrincipal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Interest</p>
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(preview.interestAmount)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-xs">Maturity Amount</p>
                    <p className="font-bold text-green-600 text-xl">
                      {formatCurrency(preview.maturityAmount)}
                    </p>
                  </div>
                </div>
              </div>
            )}

              <Button
                className="w-full bg-slate-900 hover:bg-slate-700"
                onClick={handleOpenRDAccount}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opening Account...
                  </>
                ) : (
                  "Open RD Account"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* RD Accounts List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : rdAccounts.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16">
            <p className="text-center text-slate-400 text-sm">
              No RD accounts opened yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rdAccounts.map((account) => {
            const paidMonths = account.payments.filter(
              (p) => p.status === "PAID"
            ).length;
            const pendingApproval = account.payments.filter(
              (p) => p.status === "PENDING_APPROVAL"
            ).length;
            const isExpanded = expandedAccount === account.id;

            // This month's payment
            const today = new Date();
            const thisMonthPayment = account.payments.find((p) => {
              const due = new Date(p.dueDate);
              return (
                due.getMonth() === today.getMonth() &&
                due.getFullYear() === today.getFullYear() &&
                p.status === "PENDING"
              );
            });

            return (
              <Card key={account.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-slate-500" />
                          {account.accountNumber}
                        </CardTitle>
                        <Badge
                          className={`${statusColors[account.status]} hover:${statusColors[account.status]} text-xs`}
                        >
                          {account.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {account.planYears} Year Plan
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {account.interestRate}% p.a.
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {account.customer.user.name} ·{" "}
                        {account.customer.user.phone}
                      </p>
                      <p className="text-xs text-slate-400">
                        Opened: {formatDate(account.openedAt)} · Matures:{" "}
                        {formatDate(account.maturityDate)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedAccount(isExpanded ? null : account.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Account Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Monthly Deposit</p>
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(account.monthlyDeposit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Deposited</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(account.totalDeposited)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Months Paid</p>
                      <p className="font-semibold text-slate-800">
                        {paidMonths} / {account.totalMonths}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Maturity Amount</p>
                      <p className="font-semibold text-blue-600">
                        {formatCurrency(account.maturityAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Pending Approval Notice */}
                  {pendingApproval > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
                      ⏳ {pendingApproval} payment(s) pending admin approval
                    </div>
                  )}

                  {/* This Month's Payment */}
                  {thisMonthPayment && account.status === "ACTIVE" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          This Months Deposit Due
                        </p>
                        <p className="text-xs text-green-600">
                          Month #{thisMonthPayment.monthNumber} — Due{" "}
                          {formatDate(thisMonthPayment.dueDate)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          handleSubmitPayment(account.id, thisMonthPayment.id)
                        }
                        disabled={markingPayment === thisMonthPayment.id}
                      >
                        {markingPayment === thisMonthPayment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          `Collect ₹${account.monthlyDeposit}`
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Deposit Progress</span>
                      <span>
                        {Math.round((paidMonths / account.totalMonths) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(paidMonths / account.totalMonths) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Monthly Schedule - Expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">
                        Monthly Payment Schedule
                      </p>
                      <div className="space-y-1.5 max-h-72 overflow-y-auto">
                        {account.payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              {paymentStatusIcon(payment.status)}
                              <div>
                                <p className="text-xs font-medium text-slate-700">
                                  Month #{payment.monthNumber}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {formatDate(payment.dueDate)}
                                  {payment.paidDate &&
                                    ` · Paid: ${formatDate(payment.paidDate)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-700">
                                {formatCurrency(payment.amount)}
                              </span>
                              {payment.status === "PENDING_APPROVAL" && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Awaiting
                                </span>
                              )}
                              {payment.status === "PENDING" &&
                                account.status === "ACTIVE" && (
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs bg-slate-700 hover:bg-slate-800 px-2"
                                    onClick={() =>
                                      handleSubmitPayment(
                                        account.id,
                                        payment.id
                                      )
                                    }
                                    disabled={markingPayment === payment.id}
                                  >
                                    {markingPayment === payment.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Collect"
                                    )}
                                  </Button>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}