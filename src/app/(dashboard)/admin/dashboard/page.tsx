// import { prisma } from "@/lib/prisma";
// import { formatCurrency } from "@/lib/utils";
// import {
//   Users,
//   UserCheck,
//   FileText,
//   TrendingUp,
//   AlertCircle,
//   CheckCircle2,
//   Clock,
// } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// // async function getStats() {
// //   const [
// //     totalCustomers,
// //     totalAgents,
// //     totalLoans,
// //     activeLoans,
// //     totalDisbursed,
// //     totalCollected,
// //     overdueEMIs,
// //     recentLoans,
// //   ] = await Promise.all([
// //     prisma.customer.count(),
// //     prisma.agent.count(),
// //     prisma.loan.count(),
// //     prisma.loan.count({ where: { status: "ACTIVE" } }),
// //     prisma.loan.aggregate({ _sum: { principalAmount: true } }),
// //     prisma.eMIPayment.aggregate({
// //       where: { status: "PAID" },
// //       _sum: { emiAmount: true },
// //     }),
// //     prisma.eMIPayment.count({ where: { status: "OVERDUE" } }),
// //     prisma.loan.findMany({
// //       take: 5,
// //       orderBy: { createdAt: "desc" },
// //       include: {
// //         customer: { include: { user: true } },
// //         agent: { include: { user: true } },
// //       },
// //     }),
// //   ]);
// //   const pendingApprovals = await prisma.eMIPayment.count({
// //   where: { status: "PENDING_APPROVAL" },
// // });

// //   return {
// //     totalCustomers,
// //     totalAgents,
// //     totalLoans,
// //     activeLoans,
// //     totalDisbursed: totalDisbursed._sum.principalAmount ?? 0,
// //     totalCollected: totalCollected._sum.emiAmount ?? 0,
// //     overdueEMIs,
// //     recentLoans,
// //     pendingApprovals,
// //   };
// // }

// async function getStats() {
//   const [
//     totalCustomers,
//     totalAgents,
//     totalLoans,
//     activeLoans,
//     totalDisbursed,
//     totalCollected,
//     overdueEMIs,
//     pendingApprovals,
//     recentLoans,
//   ] = await Promise.all([
//     prisma.customer.count(),
//     prisma.agent.count(),
//     prisma.loan.count(),
//     prisma.loan.count({ where: { status: "ACTIVE" } }),
//     prisma.loan.aggregate({ _sum: { principalAmount: true } }),
//     prisma.eMIPayment.aggregate({
//       where: { status: "PAID" },
//       _sum: { installmentAmount: true },  // ← changed from emiAmount
//     }),
//     prisma.eMIPayment.count({ where: { status: "OVERDUE" } }),
//     prisma.eMIPayment.count({ where: { status: "PENDING_APPROVAL" } }),
//     prisma.loan.findMany({
//       take: 5,
//       orderBy: { createdAt: "desc" },
//       include: {
//         customer: { include: { user: true } },
//         agent: { include: { user: true } },
//       },
//     }),
//   ]);

//   return {
//     totalCustomers,
//     totalAgents,
//     totalLoans,
//     activeLoans,
//     totalDisbursed: totalDisbursed._sum.principalAmount ?? 0,
//     totalCollected: totalCollected._sum.installmentAmount ?? 0, // ← changed
//     overdueEMIs,
//     pendingApprovals,
//     recentLoans,
//   };
// }

// export default async function AdminDashboard() {
//   const stats = await getStats();
//   console.log("Hereee is the dashboard data***********************************");
//   console.log(stats);

//   const statCards = [
//     {
//       title: "Total Customers",
//       value: stats.totalCustomers,
//       icon: Users,
//       color: "text-blue-600",
//       bg: "bg-blue-50",
//     },
//     {
//       title: "Total Agents",
//       value: stats.totalAgents,
//       icon: UserCheck,
//       color: "text-purple-600",
//       bg: "bg-purple-50",
//     },
//     {
//       title: "Active Loans",
//       value: stats.activeLoans,
//       icon: FileText,
//       color: "text-green-600",
//       bg: "bg-green-50",
//     },
//     {
//       title: "Total Disbursed",
//       value: formatCurrency(stats.totalDisbursed),
//       icon: TrendingUp,
//       color: "text-amber-600",
//       bg: "bg-amber-50",
//     },
//     {
//       title: "Total Collected",
//       value: formatCurrency(stats.totalCollected),
//       icon: CheckCircle2,
//       color: "text-teal-600",
//       bg: "bg-teal-50",
//     },
//     {
//       title: "Overdue EMIs",
//       value: stats.overdueEMIs,
//       icon: AlertCircle,
//       color: "text-red-600",
//       bg: "bg-red-50",
//     },
//     {
//       title: "Pending Approvals",
//       value: stats.pendingApprovals,
//       icon: Clock,
//       color: "text-amber-600",
//       bg: "bg-amber-50",
//     },
//   ];

//   return (
//     <div className="space-y-6">

//       {/* Stat Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {statCards.map((stat) => {
//           const Icon = stat.icon;
//           return (
//             <Card key={stat.title} className="border-slate-200">
//               <CardHeader className="flex flex-row items-center justify-between pb-2">
//                 <CardTitle className="text-sm font-medium text-slate-600">
//                   {stat.title}
//                 </CardTitle>
//                 <div className={`${stat.bg} p-2 rounded-lg`}>
//                   <Icon className={`h-4 w-4 ${stat.color}`} />
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       {/* Recent Loans */}
//       <Card className="border-slate-200">
//         <CardHeader>
//           <CardTitle className="text-slate-800 text-base">Recent Loans</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {stats.recentLoans.length === 0 ? (
//             <p className="text-slate-400 text-sm text-center py-8">
//               No loans created yet
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-slate-100">
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Loan Code</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Amount</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stats.recentLoans.map((loan) => (
//                     <tr key={loan.id} className="border-b border-slate-50 hover:bg-slate-50">
//                       <td className="py-3 px-2 font-mono text-slate-700">{loan.loanCode}</td>
//                       <td className="py-3 px-2 text-slate-700">{loan.customer.user.name}</td>
//                       <td className="py-3 px-2 text-slate-500">{loan.agent.user.name}</td>
//                       <td className="py-3 px-2 text-slate-700">{formatCurrency(loan.principalAmount)}</td>
//                       <td className="py-3 px-2">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           loan.status === "ACTIVE" ? "bg-green-100 text-green-700" :
//                           loan.status === "PENDING" ? "bg-amber-100 text-amber-700" :
//                           loan.status === "CLOSED" ? "bg-slate-100 text-slate-600" :
//                           "bg-red-100 text-red-700"
//                         }`}>
//                           {loan.status}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//     </div>
//   );
// }


"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import {
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  totalCustomers: number;
  totalAgents: number;
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  overdueEMIs: number;
  pendingApprovals: number;
  recentLoans: {
    id: string;
    loanCode: string;
    principalAmount: number;
    status: string;
    customer: { user: { name: string } };
    agent: { user: { name: string } };
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to load dashboard");
          return;
        }
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
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Agents",
      value: stats.totalAgents,
      icon: UserCheck,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Active Loans",
      value: stats.activeLoans,
      icon: FileText,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Total Disbursed",
      value: formatCurrency(stats.totalDisbursed),
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      title: "Overdue EMIs",
      value: stats.overdueEMIs,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">

      {/* Pending Approvals Alert */}
      {stats.pendingApprovals > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats.pendingApprovals}</strong> daily collection
            {stats.pendingApprovals > 1 ? "s are" : " is"} awaiting your
            approval. Go to{" "}
            <a href="/admin/loans" className="underline font-medium">
              Loans
            </a>{" "}
            to approve.
          </p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Recent Loans */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-800 text-base">
            Recent Loans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentLoans.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No loans created yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      Loan Code
                    </th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      Customer
                    </th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      Agent
                    </th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentLoans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-3 px-2 font-mono text-slate-700">
                        {loan.loanCode}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {loan.customer.user.name}
                      </td>
                      <td className="py-3 px-2 text-slate-500">
                        {loan.agent.user.name}
                      </td>
                      <td className="py-3 px-2 text-slate-700">
                        {formatCurrency(loan.principalAmount)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            loan.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : loan.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : loan.status === "CLOSED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {loan.status}
                        </span>
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