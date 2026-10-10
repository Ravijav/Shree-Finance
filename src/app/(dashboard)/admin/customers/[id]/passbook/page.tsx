"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface PassbookEntry {
  id: string;
  paymentDate: string;
  particulars: string;
  agentName: string;
  loanCode: string;
  loanType: string;
  accountNumber: string;
  dayNumber: number;
  debit: number;
  credit: number;
  balanceAmount: number;
}

interface PassbookData {
  customer: {
    customerCode: string;
    name: string;
    phone: string;
    agentName: string;
  };
  passbookEntries: PassbookEntry[];
}

export default function CustomerPassbookPage() {
  const params = useParams();
  const customerId = params.id as string;
  const [data, setData] = useState<PassbookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/admin/customers/${customerId}/passbook`
        );
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error);
          return;
        }
        setData(json);
      } catch {
        toast.error("Failed to load passbook");
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

  const { customer, passbookEntries } = data;
  const totalCredit = passbookEntries.reduce((sum, e) => sum + e.credit, 0);
  const totalDebit = passbookEntries.reduce((sum, e) => sum + e.debit, 0);

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

      {/* Passbook Card */}
      <Card className="border-slate-200" id="passbook-print">
        <CardContent className="pt-6">

          {/* Header */}
          <div className="text-center mb-6 border-b border-slate-200 pb-4">
            <h1 className="text-2xl font-bold underline text-slate-900">
              Passbook
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Shree Shyam Financial Services
            </p>
          </div>

          {/* Customer Info */}
          <div className="mb-6 space-y-1">
            <p className="font-bold text-slate-900 text-lg">
              {customer.customerCode} — {customer.name}
            </p>
            <p className="text-slate-600 text-sm">Phone: {customer.phone}</p>
            <p className="text-slate-600 text-sm">Agent: {customer.agentName}</p>
          </div>

          {/* Table */}
          {passbookEntries.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No payments made yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="text-left py-3 px-3 font-medium border border-slate-700">
                      Payment Date
                    </th>
                    <th className="text-left py-3 px-3 font-medium border border-slate-700">
                      Particulars
                    </th>
                    <th className="text-left py-3 px-3 font-medium border border-slate-700">
                      Agent Name
                    </th>
                    <th className="text-left py-3 px-3 font-medium border border-slate-700">
                      Loan / A/C No
                    </th>
                    <th className="text-left py-3 px-3 font-medium border border-slate-700">
                      Day No
                    </th>
                    <th className="text-right py-3 px-3 font-medium border border-slate-700">
                      Debit
                    </th>
                    <th className="text-right py-3 px-3 font-medium border border-slate-700">
                      Credit
                    </th>
                    <th className="text-right py-3 px-3 font-medium border border-slate-700">
                      Balance Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {passbookEntries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
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
                        {entry.particulars}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-700">
                        {entry.agentName}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 font-mono text-slate-600 text-xs">
                        {entry.accountNumber}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-slate-600 text-center">
                        {entry.dayNumber}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right text-slate-700">
                        {entry.debit > 0
                          ? formatCurrency(entry.debit)
                          : "0.00"}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right text-green-700 font-medium">
                        {formatCurrency(entry.credit)}
                      </td>
                      <td className="py-2 px-3 border border-slate-200 text-right font-semibold text-slate-800">
                        {formatCurrency(entry.balanceAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Totals */}
                <tfoot>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <td
                      colSpan={5}
                      className="py-3 px-3 border border-slate-700"
                    >
                      Total
                    </td>
                    <td className="py-3 px-3 border border-slate-700 text-right">
                      {totalDebit > 0 ? formatCurrency(totalDebit) : "0.00"}
                    </td>
                    <td className="py-3 px-3 border border-slate-700 text-right">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td className="py-3 px-3 border border-slate-700 text-right">
                      {formatCurrency(
                        passbookEntries[passbookEntries.length - 1]
                          ?.balanceAmount ?? 0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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