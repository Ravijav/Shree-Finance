// "use client";

// import { useState, useEffect } from "react";
// import { toast } from "sonner";
// import { Loader2, Users, Search, Filter, BookOpen } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Label } from "@/components/ui/label";
// import { formatDate, formatCurrency } from "@/lib/utils";
// import { useRouter } from "next/navigation";

// // interface Customer {
// //   id: string;
// //   customerCode: string;
// //   address: string | null;
// //   createdAt: string;
// //   user: {
// //     name: string;
// //     email: string;
// //     phone: string;
// //     isActive: boolean;
// //   };
// //   agent: {
// //     user: { name: string };
// //   };
// //   loans: {
// //     id: string;
// //     status: string;
// //     principalAmount: number;
// //   }[];
// // }
// interface Customer {
//   id: string;
//   customerCode: string;
//   address: string | null;
//   createdAt: string;
//   user: {
//     name: string;
//     email: string;
//     phone: string;
//     isActive: boolean;
//   };
//   agent: {
//     user: { name: string };
//   };
//   loans: {
//     id: string;
//     status: string;
//     principalAmount: number;
//   }[];
//   rdAccounts: {                          // ← add this
//     id: string;
//     accountNumber: string;
//     status: string;
//     monthlyDeposit: number;
//     totalDeposited: number;
//     maturityAmount: number;
//   }[];
// }

// export default function CustomersPage() {
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [filtered, setFiltered] = useState<Customer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");

//   const router = useRouter();

//   const loadCustomers = async (from?: string, to?: string) => {
//     setLoading(true);
//     try {
//       const params = new URLSearchParams();
//       if (from) params.append("from", from);
//       if (to) params.append("to", to);

//       const res = await fetch(`/api/admin/customers?${params.toString()}`);
//       const data = await res.json();
//       setCustomers(data);
//       setFiltered(data);
//     } catch {
//       toast.error("Failed to fetch customers");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const load = async () => {
//       await loadCustomers();
//     };
//     load();
//   }, []);

//   // Search filter
//   useEffect(() => {
//     const applySearch = () => {
//       if (!search.trim()) {
//         setFiltered(customers);
//         return;
//       }
//       const q = search.toLowerCase();
//       setFiltered(
//         customers.filter(
//           (c) =>
//             c.user.name.toLowerCase().includes(q) ||
//             c.user.phone.includes(q) ||
//             c.customerCode.toLowerCase().includes(q) ||
//             c.agent.user.name.toLowerCase().includes(q)
//         )
//       );
//     };
//     applySearch();
//   }, [search, customers]);

//   const handleDateFilter = async () => {
//     if (!fromDate || !toDate) {
//       toast.error("Please select both from and to dates");
//       return;
//     }
//     await loadCustomers(fromDate, toDate);
//   };

//   const handleClearFilter = async () => {
//     setFromDate("");
//     setToDate("");
//     await loadCustomers();
//   };

//   const getActiveLoans = (loans: Customer["loans"]) =>
//     loans.filter((l) => l.status === "ACTIVE").length;

//   const getTotalRDDeposited = (rdAccounts: Customer["rdAccounts"]) =>
//   rdAccounts.reduce((sum, rd) => sum + rd.totalDeposited, 0);

//   const getTotalLoanAmount = (loans: Customer["loans"]) =>
//     loans.reduce((sum, l) => sum + l.principalAmount, 0);

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div>
//         <h2 className="text-xl font-semibold text-slate-800">Customers</h2>
//         <p className="text-sm text-slate-500 mt-1">
//           View and manage all customers
//         </p>
//       </div>

//       {/* Filters */}
//       <Card className="border-slate-200">
//         <CardContent className="pt-4">
//           <div className="flex flex-col sm:flex-row gap-4 items-end">
//             {/* Search */}
//             <div className="flex-1 space-y-1">
//               <Label className="text-xs text-slate-500">Search</Label>
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
//                 <Input
//                   placeholder="Search by name, phone, code, agent..."
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   className="pl-9"
//                 />
//               </div>
//             </div>

//             {/* Date Filter */}
//             <div className="space-y-1">
//               <Label className="text-xs text-slate-500">From Date</Label>
//               <Input
//                 type="date"
//                 value={fromDate}
//                 onChange={(e) => setFromDate(e.target.value)}
//                 className="w-40"
//               />
//             </div>
//             <div className="space-y-1">
//               <Label className="text-xs text-slate-500">To Date</Label>
//               <Input
//                 type="date"
//                 value={toDate}
//                 onChange={(e) => setToDate(e.target.value)}
//                 className="w-40"
//               />
//             </div>
//             <Button
//               onClick={handleDateFilter}
//               className="bg-slate-900 hover:bg-slate-700 gap-2"
//             >
//               <Filter className="h-4 w-4" />
//               Filter
//             </Button>
//             {(fromDate || toDate) && (
//               <Button variant="outline" onClick={handleClearFilter}>
//                 Clear
//               </Button>
//             )}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Customers Table */}
//       <Card className="border-slate-200">
//         <CardHeader>
//           <CardTitle className="text-base text-slate-800 flex items-center gap-2">
//             <Users className="h-4 w-4" />
//             All Customers ({filtered.length})
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="flex justify-center py-10">
//               <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
//             </div>
//           ) : filtered.length === 0 ? (
//             <p className="text-center text-slate-400 text-sm py-10">
//               No customers found
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full text-sm">
//                 <thead>
//                   <tr className="border-b border-slate-100">
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Code</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Phone</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Active Loans</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">RD Accounts</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Total Loan Amount</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Joined</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
//                     <th className="text-left py-3 px-2 text-slate-500 font-medium">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                 {filtered.map((customer) => (
//                   <tr
//                     key={customer.id}
//                     className="border-b border-slate-50 hover:bg-slate-50"
//                   >
//                     <td className="py-3 px-2">
//                       <div>
//                         <p className="font-medium text-slate-800">
//                           {customer.user.name}
//                         </p>
//                         <p className="text-slate-400 text-xs">
//                           {customer.user.email}
//                         </p>
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 font-mono text-slate-600">
//                       {customer.customerCode}
//                     </td>
//                     <td className="py-3 px-2 text-slate-600">
//                       {customer.user.phone}
//                     </td>
//                     <td className="py-3 px-2 text-slate-600">
//                       {customer.agent.user.name}
//                     </td>
//                     <td className="py-3 px-2 text-slate-600">
//                       {getActiveLoans(customer.loans)}
//                     </td>
//                     <td className="py-3 px-2">
//                     {customer.rdAccounts.length > 0 ? (
//                       <div className="space-y-1">
//                         {customer.rdAccounts
//                           .filter((rd) => rd.status === "ACTIVE")
//                           .map((rd) => (
//                             <div key={rd.id}>
//                               <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs">
//                                 {rd.accountNumber}
//                               </Badge>
//                               <p className="text-xs text-slate-400 mt-0.5">
//                                 ₹{rd.monthlyDeposit}/mo
//                               </p>
//                             </div>
//                           ))}
//                         {customer.rdAccounts.filter((rd) => rd.status === "ACTIVE").length === 0 && (
//                           <span className="text-slate-400 text-xs">No active RD</span>
//                         )}
//                       </div>
//                     ) : (
//                       <span className="text-slate-400 text-xs">—</span>
//                     )}
//                   </td>
//                     <td className="py-3 px-2 text-slate-700 font-medium">
//                       {/* {formatCurrency(getTotalLoanAmount(customer.loans))} */}
//                        <div>
//                         {formatCurrency(getTotalLoanAmount(customer.loans))}
//                         {customer.rdAccounts.length > 0 && (
//                           <p className="text-xs text-blue-600">
//                             RD: {formatCurrency(getTotalRDDeposited(customer.rdAccounts))}
//                           </p>
//                         )}
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 text-slate-500">
//                       {formatDate(customer.createdAt)}
//                     </td>
//                     <td className="py-3 px-2">
//                       <Badge
//                         className={
//                           customer.user.isActive
//                             ? "bg-green-100 text-green-700 hover:bg-green-100"
//                             : "bg-red-100 text-red-700 hover:bg-red-100"
//                         }
//                       >
//                         {customer.user.isActive ? "Active" : "Inactive"}
//                       </Badge>
//                     </td>
//                     <td className="py-3 px-2">
//                       <Button
//                         size="sm"
//                         variant="outline"
//                         className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-800 hover:border-blue-300"
//                         onClick={() => router.push(`/admin/customers/${customer.id}/passbook`)}
//                       >
//                         <BookOpen className="h-3 w-3" />
//                         Passbook
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
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
import { Loader2, Users, Search, Filter, BookOpen, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Customer {
  id: string;
  customerCode: string;
  address: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
  agent: {
    user: { name: string };
  };
  loans: {
    id: string;
    status: string;
    principalAmount: number;
  }[];
  rdAccounts: {
    id: string;
    accountNumber: string;
    status: string;
    monthlyDeposit: number;
    totalDeposited: number;
    maturityAmount: number;
  }[];
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeTab, setActiveTab] = useState<"LOAN" | "RD">("LOAN");

  const loadCustomers = async (from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data);
      setFiltered(data);
    } catch {
      toast.error("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => { await loadCustomers(); };
    load();
  }, []);

  useEffect(() => {
    const applySearch = () => {
      if (!search.trim()) { setFiltered(customers); return; }
      const q = search.toLowerCase();
      setFiltered(
        customers.filter(
          (c) =>
            c.user.name.toLowerCase().includes(q) ||
            c.user.phone.includes(q) ||
            c.customerCode.toLowerCase().includes(q) ||
            c.agent.user.name.toLowerCase().includes(q)
        )
      );
    };
    applySearch();
  }, [search, customers]);

  const handleDateFilter = async () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }
    await loadCustomers(fromDate, toDate);
  };

  const handleClearFilter = async () => {
    setFromDate("");
    setToDate("");
    await loadCustomers();
  };

  const getActiveLoans = (loans: Customer["loans"]) =>
    loans.filter((l) => l.status === "ACTIVE").length;

  const getTotalLoanAmount = (loans: Customer["loans"]) =>
    loans.reduce((sum, l) => sum + l.principalAmount, 0);

  const getTotalRDDeposited = (rdAccounts: Customer["rdAccounts"]) =>
    rdAccounts.reduce((sum, rd) => sum + rd.totalDeposited, 0);

  // Filter customers based on active tab
  const loanCustomers = filtered.filter((c) => c.loans.length > 0);
  const rdCustomers = filtered.filter((c) => c.rdAccounts.length > 0);
  const displayCustomers = activeTab === "LOAN" ? loanCustomers : rdCustomers;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Customers</h2>
        <p className="text-sm text-slate-500 mt-1">
          View and manage all customers
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("LOAN")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "LOAN"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <FileText className="h-4 w-4" />
          Loan Customers
          <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
            {loanCustomers.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("RD")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "RD"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          RD Customers
          <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded-full">
            {rdCustomers.length}
          </span>
        </button>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-slate-500">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, phone, code, agent..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">From Date</Label>
              <Input type="date" value={fromDate}
                onChange={(e) => setFromDate(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">To Date</Label>
              <Input type="date" value={toDate}
                onChange={(e) => setToDate(e.target.value)} className="w-40" />
            </div>
            <Button onClick={handleDateFilter} className="bg-slate-900 hover:bg-slate-700 gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
            {(fromDate || toDate) && (
              <Button variant="outline" onClick={handleClearFilter}>Clear</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {activeTab === "LOAN" ? "Loan" : "RD"} Customers ({displayCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : displayCustomers.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No {activeTab === "LOAN" ? "loan" : "RD"} customers found
            </p>
          ) : activeTab === "LOAN" ? (

            /* ── Loan Customers Table ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Active Loans</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Total Loan</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loanCustomers.map((customer) => (
                    <tr key={customer.id}
                      className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-800">{customer.user.name}</p>
                        <p className="text-slate-400 text-xs">{customer.user.email}</p>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">{customer.customerCode}</td>
                      <td className="py-3 px-2 text-slate-600">{customer.user.phone}</td>
                      <td className="py-3 px-2 text-slate-600">{customer.agent.user.name}</td>
                      <td className="py-3 px-2 text-slate-600">{getActiveLoans(customer.loans)}</td>
                      <td className="py-3 px-2 font-medium text-slate-700">
                        {formatCurrency(getTotalLoanAmount(customer.loans))}
                      </td>
                      <td className="py-3 px-2 text-slate-500">{formatDate(customer.createdAt)}</td>
                      <td className="py-3 px-2">
                        <Badge className={customer.user.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"}>
                          {customer.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-800 hover:border-blue-300"
                          onClick={() => router.push(`/admin/customers/${customer.id}/passbook`)}
                        >
                          <BookOpen className="h-3 w-3" />
                          Passbook
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          ) : (

            /* ── RD Customers Table ── */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Agent</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">RD Accounts</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Total Deposited</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rdCustomers.map((customer) => (
                    <tr key={customer.id}
                      className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-800">{customer.user.name}</p>
                        <p className="text-slate-400 text-xs">{customer.user.email}</p>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">{customer.customerCode}</td>
                      <td className="py-3 px-2 text-slate-600">{customer.user.phone}</td>
                      <td className="py-3 px-2 text-slate-600">{customer.agent.user.name}</td>
                      <td className="py-3 px-2">
                        <div className="space-y-1">
                          {customer.rdAccounts.map((rd) => (
                            <div key={rd.id} className="flex items-center gap-1">
                              <Badge className={
                                rd.status === "ACTIVE"
                                  ? "bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                                  : rd.status === "MATURED"
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-100 text-xs"
                              }>
                                {rd.accountNumber}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-700">
                        {formatCurrency(getTotalRDDeposited(customer.rdAccounts))}
                      </td>
                      <td className="py-3 px-2 text-slate-500">{formatDate(customer.createdAt)}</td>
                      <td className="py-3 px-2">
                        <Badge className={customer.user.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-100"
                          : "bg-red-100 text-red-700 hover:bg-red-100"}>
                          {customer.user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 text-blue-600 hover:text-blue-800 hover:border-blue-300"
                          onClick={() => router.push(`/admin/customers/${customer.id}/rd-passbook`)}
                        >
                          <BookOpen className="h-3 w-3" />
                          RD Passbook
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
    </div>
  );
}