"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  totalCustomers: number;
  activeLoans: number;
  totalLoans: number;
  totalCollected: number;
  overdueEMIs: number;
  pendingApprovals: number;
  recentCustomers: {
    id: string;
    customerCode: string;
    user: { name: string; phone: string };
    loans: { status: string; principalAmount: number }[];
  }[];
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/agent/stats");
        const data = await res.json();
        setStats(data);
      } catch {
        toast.error("Failed to load dashboard");
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

  if (!stats) return null;

  const statCards = [
    {
      title: "My Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Loans",
      value: stats.activeLoans,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Pending Approval",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Overdue Days",
      value: stats.overdueEMIs,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Pending Approval Alert */}
      {stats.pendingApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats.pendingApprovals}</strong> daily collection
            {stats.pendingApprovals > 1 ? "s are" : " is"} awaiting admin
            approval.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-slate-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Customers */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800">
            Recent Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentCustomers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No customers added yet
            </p>
          ) : (
            <div className="space-y-3">
              {stats.recentCustomers.map((customer) => {
                const activeLoans = customer.loans.filter(
                  (l) => l.status === "ACTIVE"
                ).length;
                const totalAmount = customer.loans.reduce(
                  (sum, l) => sum + l.principalAmount,
                  0
                );
                return (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {customer.user.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {customer.user.phone} · {customer.customerCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-700">
                        {formatCurrency(totalAmount)}
                      </p>
                      <Badge
                        className={
                          activeLoans > 0
                            ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs"
                        }
                      >
                        {activeLoans} active loan{activeLoans !== 1 ? "s" : ""}
                      </Badge>
                    </div>
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