"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RDPayment {
  id: string;
  monthNumber: number;
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: string;
  remarks: string | null;
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
  openedAt: string;
  maturityDate: string;
  status: string;
  customer: {
    customerCode: string;
    user: { name: string; phone: string };
  };
  agent: {
    user: { name: string };
  };
  payments: RDPayment[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MATURED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
  PREMATURE: "bg-red-100 text-red-700",
};

export default function AdminRDAccountsPage() {
  const [rdAccounts, setRdAccounts] = useState<RDAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<RDAccount | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<RDPayment | null>(null);
  const [revertOpen, setRevertOpen] = useState(false);
  const [revertReason, setRevertReason] = useState("");
  const [reverting, setReverting] = useState(false);

  const loadRDAccounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/rd-accounts");
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
    };
    load();
  }, []);

  const handleApprovePayment = async (
    rdAccountId: string,
    paymentId: string
  ) => {
    try {
      const res = await fetch(
        `/api/admin/rd-accounts/${rdAccountId}/approve-payment`,
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
      toast.success("Payment approved successfully!");
      await loadRDAccounts();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleRevertPayment = async () => {
    if (!selectedAccount || !selectedPayment || !revertReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setReverting(true);
    try {
      const res = await fetch(
        `/api/admin/rd-accounts/${selectedAccount.id}/revert-payment`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: selectedPayment.id,
            reason: revertReason,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Payment reverted successfully");
      setRevertOpen(false);
      setRevertReason("");
      await loadRDAccounts();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setReverting(false);
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

  const totalPendingApprovals = rdAccounts.reduce(
    (sum, acc) =>
      sum +
      acc.payments.filter((p) => p.status === "PENDING_APPROVAL").length,
    0
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">RD Accounts</h2>
        <p className="text-sm text-slate-500 mt-1">
          View and manage all recurring deposit accounts
        </p>
      </div>

      {/* Pending Approvals Alert */}
      {totalPendingApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{totalPendingApprovals}</strong> RD payment
            {totalPendingApprovals > 1 ? "s are" : " is"} awaiting your
            approval.
          </p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Accounts",
            value: rdAccounts.length,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Active",
            value: rdAccounts.filter((a) => a.status === "ACTIVE").length,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Matured",
            value: rdAccounts.filter((a) => a.status === "MATURED").length,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Total Deposited",
            value: formatCurrency(
              rdAccounts.reduce((sum, a) => sum + a.totalDeposited, 0)
            ),
            color: "text-teal-600",
            bg: "bg-teal-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-slate-200">
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* RD Accounts List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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
                          {account.planYears} Year — {account.interestRate}%
                        </Badge>
                        {pendingApproval > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                            {pendingApproval} pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {account.customer.user.name} ·{" "}
                        {account.customer.user.phone}
                      </p>
                      <p className="text-xs text-slate-400">
                        Agent: {account.agent.user.name} · Opened:{" "}
                        {formatDate(account.openedAt)} · Matures:{" "}
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
                    <div>
                      <p className="text-slate-400 text-xs">Total Principal</p>
                      <p className="font-semibold text-slate-700">
                        {formatCurrency(account.totalPrincipal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Interest</p>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(account.interestAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Interest On</p>
                      <p className="font-semibold text-slate-700">
                        {account.interestPayableOn}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Opening Deposit</p>
                      <p className="font-semibold text-slate-700">
                        {formatCurrency(account.openingDeposit)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Deposit Progress</span>
                      <span>
                        {Math.round(
                          (paidMonths / account.totalMonths) * 100
                        )}%
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
                            className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              {paymentStatusIcon(payment.status)}
                              <div>
                                <p className="text-xs font-medium text-slate-700">
                                  Month #{payment.monthNumber}
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
                              <span className="text-xs font-medium text-slate-700">
                                {formatCurrency(payment.amount)}
                              </span>
                              {payment.status === "PENDING_APPROVAL" && (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() =>
                                    handleApprovePayment(
                                      account.id,
                                      payment.id
                                    )
                                  }
                                >
                                  Approve
                                </Button>
                              )}
                              {payment.status === "PAID" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-red-500 hover:text-red-700 hover:border-red-300"
                                  onClick={() => {
                                    setSelectedAccount(account);
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
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Revert Payment Dialog */}
      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Revert RD Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              You are about to revert Month #{selectedPayment?.monthNumber}{" "}
              payment of{" "}
              {selectedPayment ? formatCurrency(selectedPayment.amount) : ""}.
              This will restore the deposit balance.
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
                    Reverting...
                  </>
                ) : (
                  "Revert Payment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}