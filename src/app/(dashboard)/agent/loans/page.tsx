// "use client";

// import { useState, useEffect } from "react";
// import { toast } from "sonner";
// import {
//   Loader2,
//   FileText,
//   Plus,
//   ChevronDown,
//   ChevronUp,
//   CheckCircle2,
//   Clock,
//   AlertCircle,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { formatCurrency, formatDate, calculateEMI } from "@/lib/utils";

// interface EMIPayment {
//   id: string;
//   emiNumber: number;
//   dueDate: string;
//   paidDate: string | null;
//   emiAmount: number;
//   status: string;
// }

// interface Loan {
//   id: string;
//   loanCode: string;
//   loanType: string;
//   principalAmount: number;
//   interestRate: number;
//   tenureMonths: number;
//   emiAmount: number;
//   totalAmount: number;
//   outstandingAmount: number;
//   status: string;
//   disbursedAt: string | null;
//   createdAt: string;
//   customer: {
//     id: string;
//     customerCode: string;
//     user: { name: string; phone: string };
//   };
//   emiPayments: EMIPayment[];
//   rdAccount: { accountNumber: string } | null;
// }

// interface Customer {
//   id: string;
//   customerCode: string;
//   user: { name: string; phone: string };
// }

// const statusColors: Record<string, string> = {
//   ACTIVE: "bg-green-100 text-green-700",
//   PENDING: "bg-amber-100 text-amber-700",
//   CLOSED: "bg-slate-100 text-slate-600",
//   DEFAULTED: "bg-red-100 text-red-700",
// };

// // const emiStatusIcon = (status: string) => {
// //   if (status === "PAID") return <CheckCircle2 className="h-4 w-4 text-green-500" />;
// //   if (status === "OVERDUE") return <AlertCircle className="h-4 w-4 text-red-500" />;
// //   return <Clock className="h-4 w-4 text-slate-400" />;
// // };

// const emiStatusIcon = (status: string) => {
//   if (status === "PAID")
//     return <CheckCircle2 className="h-4 w-4 text-green-500" />;
//   if (status === "PENDING_APPROVAL")
//     return <Clock className="h-4 w-4 text-amber-500" />;
//   if (status === "OVERDUE")
//     return <AlertCircle className="h-4 w-4 text-red-500" />;
//   return <Clock className="h-4 w-4 text-slate-400" />;
// };

// export default function AgentLoansPage() {
//   const [loans, setLoans] = useState<Loan[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [addOpen, setAddOpen] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
//   const [markingEMI, setMarkingEMI] = useState<string | null>(null);

//   const [form, setForm] = useState({
//     customerId: "",
//     loanType: "PERSONAL",
//     principalAmount: "",
//     interestRate: "",
//     tenureMonths: "",
//     openRDAccount: false,
//   });

//   // Calculated EMI preview
//   const previewEMI =
//     form.principalAmount && form.interestRate && form.tenureMonths
//       ? calculateEMI(
//           Number(form.principalAmount),
//           Number(form.interestRate),
//           Number(form.tenureMonths)
//         )
//       : null;

//   const loadLoans = async () => {
//     try {
//       const res = await fetch("/api/agent/loans");
//       const data = await res.json();
//       setLoans(data);
//     } catch {
//       toast.error("Failed to fetch loans");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const load = async () => {
//       await loadLoans();
//       try {
//         const res = await fetch("/api/agent/customers");
//         const data = await res.json();
//         setCustomers(data);
//       } catch {
//         toast.error("Failed to fetch customers");
//       }
//     };
//     load();
//   }, []);

//   const handleCreateLoan = async () => {
//     setSubmitting(true);
//     try {
//       const res = await fetch("/api/agent/loans", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...form,
//           principalAmount: Number(form.principalAmount),
//           interestRate: Number(form.interestRate),
//           tenureMonths: Number(form.tenureMonths),
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         toast.error(data.error);
//         return;
//       }

//       toast.success(`Loan created! Code: ${data.loanCode}`);
//       setAddOpen(false);
//       setForm({
//         customerId: "",
//         loanType: "PERSONAL",
//         principalAmount: "",
//         interestRate: "",
//         tenureMonths: "",
//         openRDAccount: false,
//       });
//       await loadLoans();
//     } catch {
//       toast.error("Something went wrong");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleMarkEMIPaid = async (loanId: string, emiPaymentId: string) => {
//     setMarkingEMI(emiPaymentId);
//     try {
//       const res = await fetch(`/api/agent/loans/${loanId}/emi`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ emiPaymentId }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         toast.error(data.error);
//         return;
//       }

//       toast.success("EMI marked as paid!");
//       await loadLoans();
//     } catch {
//       toast.error("Something went wrong");
//     } finally {
//       setMarkingEMI(null);
//     }
//   };

//   return (
//     <div className="space-y-6">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-xl font-semibold text-slate-800">Loans</h2>
//           <p className="text-sm text-slate-500 mt-1">
//             Create and manage customer loans
//           </p>
//         </div>

//         <Dialog open={addOpen} onOpenChange={setAddOpen}>
//           <DialogTrigger asChild>
//             <Button className="bg-slate-900 hover:bg-slate-700 gap-2">
//               <Plus className="h-4 w-4" />
//               Create Loan
//             </Button>
//           </DialogTrigger>
//           <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
//             <DialogHeader>
//               <DialogTitle>Create New Loan</DialogTitle>
//             </DialogHeader>
//             <div className="space-y-4 pt-2">
//               {/* Customer */}
//               <div className="space-y-2">
//                 <Label>Select Customer *</Label>
//                 <Select
//                   value={form.customerId}
//                   onValueChange={(v) => setForm({ ...form, customerId: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select a customer" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {customers.map((c) => (
//                       <SelectItem key={c.id} value={c.id}>
//                         {c.user.name} — {c.customerCode}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Loan Type */}
//               <div className="space-y-2">
//                 <Label>Loan Type *</Label>
//                 <Select
//                   value={form.loanType}
//                   onValueChange={(v) => setForm({ ...form, loanType: v })}
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="PERSONAL">Personal Loan</SelectItem>
//                     <SelectItem value="HOME">Home Loan</SelectItem>
//                     <SelectItem value="VEHICLE">Vehicle Loan</SelectItem>
//                     <SelectItem value="BUSINESS">Business Loan</SelectItem>
//                     <SelectItem value="INSURANCE">Insurance</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Principal Amount */}
//               <div className="space-y-2">
//                 <Label>Principal Amount (₹) *</Label>
//                 <Input
//                   type="number"
//                   placeholder="e.g. 100000"
//                   value={form.principalAmount}
//                   onChange={(e) =>
//                     setForm({ ...form, principalAmount: e.target.value })
//                   }
//                 />
//               </div>

//               {/* Interest Rate */}
//               <div className="space-y-2">
//                 <Label>Annual Interest Rate (%) *</Label>
//                 <Input
//                   type="number"
//                   placeholder="e.g. 12"
//                   value={form.interestRate}
//                   onChange={(e) =>
//                     setForm({ ...form, interestRate: e.target.value })
//                   }
//                 />
//               </div>

//               {/* Tenure */}
//               <div className="space-y-2">
//                 <Label>Tenure (Months) *</Label>
//                 <Input
//                   type="number"
//                   placeholder="e.g. 12"
//                   value={form.tenureMonths}
//                   onChange={(e) =>
//                     setForm({ ...form, tenureMonths: e.target.value })
//                   }
//                 />
//               </div>

//               {/* EMI Preview */}
//               {previewEMI && (
//                 <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
//                   <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
//                     EMI Preview
//                   </p>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-slate-600">Monthly EMI</span>
//                     <span className="font-semibold text-slate-800">
//                       {formatCurrency(previewEMI)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-slate-600">Total Amount</span>
//                     <span className="font-semibold text-slate-800">
//                       {formatCurrency(previewEMI * Number(form.tenureMonths))}
//                     </span>
//                   </div>
//                   <div className="flex justify-between text-sm">
//                     <span className="text-slate-600">Total Interest</span>
//                     <span className="font-semibold text-amber-600">
//                       {formatCurrency(
//                         previewEMI * Number(form.tenureMonths) -
//                           Number(form.principalAmount)
//                       )}
//                     </span>
//                   </div>
//                 </div>
//               )}

//               {/* RD Account */}
//               <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
//                 <input
//                   type="checkbox"
//                   id="openRD"
//                   checked={form.openRDAccount}
//                   onChange={(e) =>
//                     setForm({ ...form, openRDAccount: e.target.checked })
//                   }
//                   className="h-4 w-4 accent-slate-800"
//                 />
//                 <div>
//                   <Label htmlFor="openRD" className="cursor-pointer">
//                     Open RD Account
//                   </Label>
//                   <p className="text-xs text-slate-400">
//                     Customer can repay loan through RD account
//                   </p>
//                 </div>
//               </div>

//               <Button
//                 className="w-full bg-slate-900 hover:bg-slate-700"
//                 onClick={handleCreateLoan}
//                 disabled={submitting}
//               >
//                 {submitting ? (
//                   <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
//                 ) : (
//                   "Create Loan"
//                 )}
//               </Button>
//             </div>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Loans List */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
//         </div>
//       ) : loans.length === 0 ? (
//         <Card className="border-slate-200">
//           <CardContent className="py-16">
//             <p className="text-center text-slate-400 text-sm">
//               No loans created yet
//             </p>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {loans.map((loan) => {
//             const paidEMIs = loan.emiPayments.filter(
//               (e) => e.status === "PAID"
//             ).length;
//             const isExpanded = expandedLoan === loan.id;

//             return (
//               <Card key={loan.id} className="border-slate-200">
//                 <CardHeader className="pb-3">
//                   <div className="flex items-start justify-between">
//                     <div className="space-y-1">
//                       <div className="flex items-center gap-2">
//                         <CardTitle className="text-base text-slate-800">
//                           {loan.loanCode}
//                         </CardTitle>
//                         <Badge
//                           className={`${statusColors[loan.status]} hover:${statusColors[loan.status]} text-xs`}
//                         >
//                           {loan.status}
//                         </Badge>
//                         <Badge variant="outline" className="text-xs">
//                           {loan.loanType}
//                         </Badge>
//                         {loan.rdAccount && (
//                           <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">
//                             RD: {loan.rdAccount.accountNumber}
//                           </Badge>
//                         )}
//                       </div>
//                       <p className="text-sm text-slate-600">
//                         {loan.customer.user.name} · {loan.customer.user.phone}
//                       </p>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() =>
//                         setExpandedLoan(isExpanded ? null : loan.id)
//                       }
//                       className="text-slate-500"
//                     >
//                       {isExpanded ? (
//                         <ChevronUp className="h-4 w-4" />
//                       ) : (
//                         <ChevronDown className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </div>
//                 </CardHeader>

//                 <CardContent className="space-y-4">
//                   {/* Loan Summary */}
//                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
//                     <div>
//                       <p className="text-slate-400 text-xs">Principal</p>
//                       <p className="font-semibold text-slate-800">
//                         {formatCurrency(loan.principalAmount)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-slate-400 text-xs">Monthly EMI</p>
//                       <p className="font-semibold text-slate-800">
//                         {formatCurrency(loan.emiAmount)}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-slate-400 text-xs">EMIs Paid</p>
//                       <p className="font-semibold text-slate-800">
//                         {paidEMIs} / {loan.tenureMonths}
//                       </p>
//                     </div>
//                     <div>
//                       <p className="text-slate-400 text-xs">Outstanding</p>
//                       <p className="font-semibold text-amber-600">
//                         {formatCurrency(loan.outstandingAmount)}
//                       </p>
//                     </div>
//                   </div>

//                   {/* Progress Bar */}
//                   <div>
//                     <div className="flex justify-between text-xs text-slate-400 mb-1">
//                       <span>Repayment Progress</span>
//                       <span>
//                         {Math.round((paidEMIs / loan.tenureMonths) * 100)}%
//                       </span>
//                     </div>
//                     <div className="w-full bg-slate-100 rounded-full h-2">
//                       <div
//                         className="bg-slate-800 h-2 rounded-full transition-all"
//                         style={{
//                           width: `${(paidEMIs / loan.tenureMonths) * 100}%`,
//                         }}
//                       />
//                     </div>
//                   </div>

//                   {/* EMI Schedule - Expanded */}
//                   {isExpanded && (
//                     <div className="border-t border-slate-100 pt-4">
//                       <p className="text-sm font-medium text-slate-700 mb-3">
//                         EMI Schedule
//                       </p>
//                       <div className="space-y-2 max-h-72 overflow-y-auto">
//                         {loan.emiPayments.map((emi) => (
//                           <div
//                             key={emi.id}
//                             className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
//                           >
//                             <div className="flex items-center gap-3">
//                               {emiStatusIcon(emi.status)}
//                               <div>
//                                 <p className="text-sm font-medium text-slate-700">
//                                   EMI #{emi.emiNumber}
//                                 </p>
//                                 <p className="text-xs text-slate-400">
//                                   Due: {formatDate(emi.dueDate)}
//                                   {emi.paidDate &&
//                                     ` · Paid: ${formatDate(emi.paidDate)}`}
//                                 </p>
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-3">
//                               <span className="text-sm font-medium text-slate-700">
//                                 {formatCurrency(emi.emiAmount)}
//                               </span>
//                               {/* {emi.status !== "PAID" &&
//                                 loan.status === "ACTIVE" && (
//                                   <Button
//                                     size="sm"
//                                     className="h-7 text-xs bg-green-600 hover:bg-green-700"
//                                     onClick={() =>
//                                       handleMarkEMIPaid(loan.id, emi.id)
//                                     }
//                                     disabled={markingEMI === emi.id}
//                                   >
//                                     {markingEMI === emi.id ? (
//                                       <Loader2 className="h-3 w-3 animate-spin" />
//                                     ) : (
//                                       "Mark Paid"
//                                     )}
//                                   </Button>
//                                 )} */}

//                                 {emi.status !== "PAID" &&
//                                   emi.status !== "PENDING_APPROVAL" &&
//                                   loan.status === "ACTIVE" && (
//                                     <Button
//                                       size="sm"
//                                       className="h-7 text-xs bg-amber-500 hover:bg-amber-600"
//                                       onClick={() => handleMarkEMIPaid(loan.id, emi.id)}
//                                       disabled={markingEMI === emi.id}
//                                     >
//                                       {markingEMI === emi.id ? (
//                                         <Loader2 className="h-3 w-3 animate-spin" />
//                                       ) : (
//                                         "Submit Payment"
//                                       )}
//                                     </Button>
//                                   )}
//                                 {emi.status === "PENDING_APPROVAL" && (
//                                   <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
//                                     Awaiting Approval
//                                   </span>
//                                 )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertCircle,
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
import { formatCurrency, formatDate, calculateRDLoanSummary } from "@/lib/utils";

interface DailyPayment {
  id: string;
  dayNumber: number;
  dueDate: string;
  paidDate: string | null;
  installmentAmount: number;
  status: string;
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
  interestAmount: number;
  principalPerDay: number;
  interestPerDay: number;
  principalCollected: number;
  interestCollected: number;
  status: string;
  disbursedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    customerCode: string;
    user: { name: string; phone: string };
  };
  emiPayments: DailyPayment[];
  rdAccount: { accountNumber: string } | null;
}

interface Customer {
  id: string;
  customerCode: string;
  user: { name: string; phone: string };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  CLOSED: "bg-slate-100 text-slate-600",
  DEFAULTED: "bg-red-100 text-red-700",
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

export default function AgentLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [markingPayment, setMarkingPayment] = useState<string | null>(null);

  const [deductOpen, setDeductOpen] = useState(false);
  const [deductLoanId, setDeductLoanId] = useState<string | null>(null);
  const [deductEmiId, setDeductEmiId] = useState<string | null>(null);
  const [deductReason, setDeductReason] = useState("");
  const [rdAccounts, setRdAccounts] = useState<{
    id: string;
    accountNumber: string;
    totalDeposited: number;
    monthlyDeposit: number;
  }[]>([]);
  const [selectedRDAccount, setSelectedRDAccount] = useState("");
  const [loadingRD, setLoadingRD] = useState(false);
  const [submittingDeduct, setSubmittingDeduct] = useState(false);

  const [form, setForm] = useState({
    customerId: "",
    loanType: "PERSONAL",
    principalAmount: "",
    interestRate: "",
    tenureDays: "",
    // openRDAccount: false,
  });

  // RD Loan Summary Preview
  const summary =
    form.principalAmount && form.interestRate && form.tenureDays
      ? calculateRDLoanSummary(
          Number(form.principalAmount),
          Number(form.interestRate),
          Number(form.tenureDays)
        )
      : null;
  const loadLoans = async () => {
    try {
      const res = await fetch("/api/agent/loans");
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to fetch loans");
        setLoans([]);
        return;
      }
      setLoans(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to fetch loans");
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadLoans();
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

  const handleCreateLoan = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          principalAmount: Number(form.principalAmount),
          interestRate: Number(form.interestRate),
          tenureDays: Number(form.tenureDays),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(`Loan created! Code: ${data.loanCode}`);
      setAddOpen(false);
      setForm({
        customerId: "",
        loanType: "PERSONAL",
        principalAmount: "",
        interestRate: "",
        tenureDays: "",
        // openRDAccount: false,
      });
      await loadLoans();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitPayment = async (loanId: string, emiPaymentId: string) => {
    setMarkingPayment(emiPaymentId);
    try {
      const res = await fetch(`/api/agent/loans/${loanId}/emi`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emiPaymentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Daily collection submitted for approval!");
      await loadLoans();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setMarkingPayment(null);
    }
  };
  const handleOpenDeductDialog = async (loanId: string, emiId: string) => {
  setDeductLoanId(loanId);
  setDeductEmiId(emiId);
  setLoadingRD(true);
  setDeductOpen(true);
  try {
    const res = await fetch(`/api/agent/loans/${loanId}/rd-accounts`);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      setDeductOpen(false);
      return;
    }
    if (data.rdAccounts.length === 0) {
      toast.error("No RD account with sufficient balance found for this customer");
      setDeductOpen(false);
      return;
    }
    setRdAccounts(data.rdAccounts);
    setSelectedRDAccount(data.rdAccounts[0].id);
  } catch {
    toast.error("Failed to fetch RD accounts");
    setDeductOpen(false);
  } finally {
    setLoadingRD(false);
  }
};

  const handleSubmitRDDeduction = async () => {
    if (!deductLoanId || !deductEmiId || !selectedRDAccount || !deductReason.trim()) {
      toast.error("Please select an RD account and provide a reason");
      return;
    }
    setSubmittingDeduct(true);
    try {
      const res = await fetch(`/api/agent/loans/${deductLoanId}/deduct-from-rd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emiPaymentId: deductEmiId,
          rdAccountId: selectedRDAccount,
          reason: deductReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("RD deduction request submitted for admin approval!");
      setDeductOpen(false);
      setDeductReason("");
      setSelectedRDAccount("");
      await loadLoans();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmittingDeduct(false);
    }
  };

  return (
    <div className="space-y-6">

       {/* Header */}
       <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Loans</h2>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage daily collection loans
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 gap-2">
              <Plus className="h-4 w-4" />
              Create Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New RD Loan</DialogTitle>
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

              {/* Loan Type */}
              <div className="space-y-2">
                <Label>Loan Type *</Label>
                <Select
                  value={form.loanType}
                  onValueChange={(v) => setForm({ ...form, loanType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Personal Loan</SelectItem>
                    <SelectItem value="HOME">Home Loan</SelectItem>
                    <SelectItem value="VEHICLE">Vehicle Loan</SelectItem>
                    <SelectItem value="BUSINESS">Business Loan</SelectItem>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Principal Amount */}
              <div className="space-y-2">
                <Label>Principal Amount (₹) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 10000"
                  value={form.principalAmount}
                  onChange={(e) =>
                    setForm({ ...form, principalAmount: e.target.value })
                  }
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-2">
                <Label>Monthly Interest Rate (%) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 12"
                  value={form.interestRate}
                  onChange={(e) =>
                    setForm({ ...form, interestRate: e.target.value })
                  }
                />
              </div>

              {/* Tenure in Days */}
              <div className="space-y-2">
                <Label>Tenure (Days) *</Label>
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  value={form.tenureDays}
                  onChange={(e) =>
                    setForm({ ...form, tenureDays: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400">
                  Please enter 100 days for perfect calculation
                </p>
              </div>

              {/* RD Loan Summary Preview */}
              {/* {summary && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    RD Loan Summary
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Principal</p>
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(summary.principal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Interest</p>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(summary.interest)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Total Payable</p>
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(summary.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Daily Collection</p>
                      <p className="font-bold text-green-600 text-lg">
                        {formatCurrency(summary.dailyInstallment)}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                    Collect{" "}
                    <strong>{formatCurrency(summary.dailyInstallment)}</strong>{" "}
                    daily for <strong>{summary.tenureDays} days</strong>
                  </div>
                </div>
              )} */}

              {summary && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  RD Loan Summary
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs">Principal</p>
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(summary.principal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Interest</p>
                    <p className="font-semibold text-amber-600">
                      {formatCurrency(summary.interest)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Total Payable</p>
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(summary.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Daily Collection</p>
                    <p className="font-bold text-green-600 text-lg">
                      {formatCurrency(summary.dailyInstallment)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
                  Collect{" "}
                  <strong>{formatCurrency(summary.dailyInstallment)}</strong>{" "}
                  daily for <strong>{summary.tenureDays} days</strong>
                </div>
              </div>
            )}

              {/* RD Account */}
              {/* <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                <input
                  type="checkbox"
                  id="openRD"
                  checked={form.openRDAccount}
                  onChange={(e) =>
                    setForm({ ...form, openRDAccount: e.target.checked })
                  }
                  className="h-4 w-4 accent-slate-800"
                />
                <div>
                  <Label htmlFor="openRD" className="cursor-pointer">
                    Open RD Account
                  </Label>
                  <p className="text-xs text-slate-400">
                    Track daily deposits separately
                  </p>
                </div>
              </div> */}

              <Button
                className="w-full bg-slate-900 hover:bg-slate-700"
                onClick={handleCreateLoan}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Loan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>

          {/* Loans List */}
        {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
       ) : loans.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-16">
            <p className="text-center text-slate-400 text-sm">
              No loans created yet
            </p>
          </CardContent>
        </Card>
       ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const paidDays = loan.emiPayments.filter(
              (e) => e.status === "PAID"
            ).length;
            const pendingApproval = loan.emiPayments.filter(
              (e) => e.status === "PENDING_APPROVAL"
            ).length;
            const isExpanded = expandedLoan === loan.id;

            // Today's pending payment
            const today = new Date().toDateString();
            const todayPayment = loan.emiPayments.find(
              (e) =>
                new Date(e.dueDate).toDateString() === today &&
                e.status === "PENDING"
            );

            return (
              <Card key={loan.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base text-slate-800">
                          {loan.loanCode}
                        </CardTitle>
                        <Badge
                          className={`${statusColors[loan.status]} hover:${statusColors[loan.status]} text-xs`}
                        >
                          {loan.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {loan.loanType}
                        </Badge>
                        {loan.rdAccount && (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs">
                            RD: {loan.rdAccount.accountNumber}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">
                        {loan.customer.user.name} · {loan.customer.user.phone}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedLoan(isExpanded ? null : loan.id)
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
                  {/* Loan Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 text-xs">Principal</p>
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(loan.principalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Daily Collection</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(loan.dailyInstallment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Days Paid</p>
                      <p className="font-semibold text-slate-800">
                        {paidDays} / {loan.totalDays} days
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Outstanding</p>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(loan.outstandingAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Pending Approval Notice */}
                  {pendingApproval > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
                      ⏳ {pendingApproval} day(s) pending admin approval
                    </div>
                  )}

                  {/* Today's Collection */}
                  {todayPayment && loan.status === "ACTIVE" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          Todays Collection Due
                        </p>
                        <p className="text-xs text-green-600">
                          Day #{todayPayment.dayNumber} —{" "}
                          {formatDate(todayPayment.dueDate)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() =>
                          handleSubmitPayment(loan.id, todayPayment.id)
                        }
                        disabled={markingPayment === todayPayment.id}
                      >
                        {markingPayment === todayPayment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          `Collect ₹${loan.dailyInstallment.toFixed(0)}`
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Collection Progress</span>
                      <span>
                        {Math.round((paidDays / loan.totalDays) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(paidDays / loan.totalDays) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Daily Schedule - Expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-700 mb-3">
                        Daily Collection Schedule
                      </p>
                      <div className="space-y-1.5 max-h-72 overflow-y-auto">
                        {loan.emiPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              {paymentStatusIcon(payment.status)}
                              <div>
                                <p className="text-xs font-medium text-slate-700">
                                  Day #{payment.dayNumber}
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
                                {formatCurrency(payment.installmentAmount)}
                              </span>
                              {payment.status === "PENDING_APPROVAL" && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Awaiting
                                </span>
                              )}
                              {/* {payment.status === "PENDING" &&
                                loan.status === "ACTIVE" && (
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs bg-slate-700 hover:bg-slate-800 px-2"
                                    onClick={() =>
                                      handleSubmitPayment(loan.id, payment.id)
                                    }
                                    disabled={markingPayment === payment.id}
                                  >
                                    {markingPayment === payment.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      "Collect"
                                    )}
                                  </Button>
                                )} */}
                                {/* adding ravi  */}
                                {payment.status === "PENDING" && loan.status === "ACTIVE" && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      className="h-6 text-xs bg-slate-700 hover:bg-slate-800 px-2"
                                      onClick={() => handleSubmitPayment(loan.id, payment.id)}
                                      disabled={markingPayment === payment.id}
                                    >
                                      {markingPayment === payment.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        "Collect"
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-6 text-xs px-2 text-purple-600 hover:text-purple-800 hover:border-purple-300"
                                      onClick={() => handleOpenDeductDialog(loan.id, payment.id)}
                                    >
                                      RD
                                    </Button>
                                  </div>
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
      {/* Deduct from RD Dialog */}
      <Dialog open={deductOpen} onOpenChange={setDeductOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-purple-700">
              Deduct from RD Account
            </DialogTitle>
          </DialogHeader>
          {loadingRD ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                This will request admin approval to deduct the EMI amount from the
                customers RD account balance.
              </div>

              <div className="space-y-2">
                <Label>Select RD Account</Label>
                <Select
                  value={selectedRDAccount}
                  onValueChange={setSelectedRDAccount}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rdAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.accountNumber} — Balance: {formatCurrency(acc.totalDeposited)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input
                  placeholder="e.g. Customer missed EMI payment"
                  value={deductReason}
                  onChange={(e) => setDeductReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setDeductOpen(false);
                    setDeductReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-purple-700 hover:bg-purple-800"
                  onClick={handleSubmitRDDeduction}
                  disabled={submittingDeduct || !deductReason.trim()}
                >
                  {submittingDeduct ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    "Request Deduction"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}