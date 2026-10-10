"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Printer, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PassbookEntry {
  id: string;
  paymentDate: string;
  particulars: string;
  monthNumber: number | null;
  debit: number;
  credit: number;
  balanceAmount: number;
  type: string;
}

interface RDPassbook {
  accountNumber: string;
  planYears: number;
  interestRate: number;
  monthlyDeposit: number;
  totalDeposited: number;
  maturityAmount: number;
  interestAmount: number;
  openedAt: string;
  maturityDate: string;
  status: string;
  entries: PassbookEntry[];
}

interface RDPassbookData {
  customer: {
    customerCode: string;
    name: string;
    phone: string;
    agentName: string;
  };
  rdPassbooks: RDPassbook[];
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MATURED: "bg-blue-100 text-blue-700",
  CLOSED: "bg-slate-100 text-slate-600",
  PREMATURE: "bg-red-100 text-red-700",
};

export default function RDPassbookPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [data, setData] = useState<RDPassbookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/admin/customers/${customerId}/rd-passbook`
        );
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error);
          return;
        }
        setData(json);
        if (json.rdPassbooks.length > 0) {
          setSelectedAccount(json.rdPassbooks[0].accountNumber);
        }
      } catch {
        toast.error("Failed to load RD passbook");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) return null;

  const { customer, rdPassbooks } = data;
  const activePassbook = rdPassbooks.find(
    (rd) => rd.accountNumber === selectedAccount
  );

  return (
    <div className="space-y-6">

      {/* Back + Print */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" /> Print Passbook
        </Button>
      </div>

      {/* No RD Accounts */}
      {rdPassbooks.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16 text-center">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              No RD accounts found for this customer
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* RD Account Selector (if multiple) */}
          {rdPassbooks.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {rdPassbooks.map((rd) => (
                <button
                  key={rd.accountNumber}
                  onClick={() => setSelectedAccount(rd.accountNumber)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    selectedAccount === rd.accountNumber
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {rd.accountNumber}
                </button>
              ))}
            </div>
          )}

          {activePassbook && (
            <Card className="border-slate-200" id="passbook-print">
              <CardContent className="pt-6">

                {/* Header */}
                <div className="text-center mb-6 border-b border-slate-200 pb-4">
                  <h1 className="text-2xl font-bold underline text-slate-900">
                    RD Account Passbook
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Shree Shyam Financial Services
                  </p>
                </div>

                {/* Customer + Account Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-lg">
                      {customer.customerCode} — {customer.name}
                    </p>
                    <p className="text-slate-600 text-sm">
                      Phone: {customer.phone}
                    </p>
                    <p className="text-slate-600 text-sm">
                      Agent: {customer.agentName}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500">Account No:</p>
                      <p className="font-mono font-semibold text-slate-800">
                        {activePassbook.accountNumber}
                      </p>
                      <Badge
                        className={`${statusColors[activePassbook.status]} hover:${statusColors[activePassbook.status]} text-xs`}
                      >
                        {activePassbook.status}
                      </Badge>
                    </div>
                    <p className="text-slate-500">
                      Plan:{" "}
                      <span className="text-slate-800 font-medium">
                        {activePassbook.planYears} Year @{" "}
                        {activePassbook.interestRate}% p.a.
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Monthly Deposit:{" "}
                      <span className="text-slate-800 font-medium">
                        {formatCurrency(activePassbook.monthlyDeposit)}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Opened:{" "}
                      <span className="text-slate-800 font-medium">
                        {formatDate(activePassbook.openedAt)}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Maturity Date:{" "}
                      <span className="text-slate-800 font-medium">
                        {formatDate(activePassbook.maturityDate)}
                      </span>
                    </p>
                    <p className="text-slate-500">
                      Maturity Amount:{" "}
                      <span className="text-green-600 font-bold">
                        {formatCurrency(activePassbook.maturityAmount)}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Passbook Table */}
                {activePassbook.entries.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-10">
                    No transactions yet
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border border-slate-300">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="text-left py-3 px-3 font-medium border border-slate-700">
                            Date
                          </th>
                          <th className="text-left py-3 px-3 font-medium border border-slate-700">
                            Particulars
                          </th>
                          <th className="text-left py-3 px-3 font-medium border border-slate-700">
                            Month #
                          </th>
                          <th className="text-right py-3 px-3 font-medium border border-slate-700">
                            Debit (₹)
                          </th>
                          <th className="text-right py-3 px-3 font-medium border border-slate-700">
                            Credit (₹)
                          </th>
                          <th className="text-right py-3 px-3 font-medium border border-slate-700">
                            Balance (₹)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePassbook.entries.map((entry, index) => (
                          <tr
                            key={entry.id}
                            className={`border-b border-slate-200 ${
                              entry.type === "DEDUCTION"
                                ? "bg-red-50"
                                : index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50/40"
                            }`}
                          >
                            <td className="py-2 px-3 border border-slate-200 text-slate-700">
                              {new Date(entry.paymentDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 text-slate-700">
                              <span
                                className={
                                  entry.type === "DEDUCTION"
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {entry.particulars}
                              </span>
                            </td>
                            <td className="py-2 px-3 border border-slate-200 text-slate-600 text-center">
                              {entry.monthNumber ?? "—"}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 text-right text-red-600 font-medium">
                              {entry.debit > 0
                                ? formatCurrency(entry.debit)
                                : "—"}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 text-right text-green-700 font-medium">
                              {entry.credit > 0
                                ? formatCurrency(entry.credit)
                                : "—"}
                            </td>
                            <td className="py-2 px-3 border border-slate-200 text-right font-semibold text-slate-800">
                              {formatCurrency(entry.balanceAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      {/* Summary Footer */}
                      <tfoot>
                        <tr className="bg-slate-900 text-white font-semibold">
                          <td
                            colSpan={3}
                            className="py-3 px-3 border border-slate-700"
                          >
                            Summary
                          </td>
                          <td className="py-3 px-3 border border-slate-700 text-right">
                            {formatCurrency(
                              activePassbook.entries.reduce(
                                (sum, e) => sum + e.debit,
                                0
                              )
                            )}
                          </td>
                          <td className="py-3 px-3 border border-slate-700 text-right">
                            {formatCurrency(
                              activePassbook.entries.reduce(
                                (sum, e) => sum + e.credit,
                                0
                              )
                            )}
                          </td>
                          <td className="py-3 px-3 border border-slate-700 text-right">
                            {formatCurrency(activePassbook.totalDeposited)}
                          </td>
                        </tr>
                        <tr className="bg-green-900 text-white">
                          <td
                            colSpan={5}
                            className="py-3 px-3 border border-green-700 font-semibold"
                          >
                            Maturity Amount (at{" "}
                            {formatDate(activePassbook.maturityDate)})
                          </td>
                          <td className="py-3 px-3 border border-green-700 text-right font-bold text-lg">
                            {formatCurrency(activePassbook.maturityAmount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #passbook-print, #passbook-print * { visibility: visible; }
          #passbook-print { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}