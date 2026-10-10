"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserPlus, Loader2, Users, Search } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  customerCode: string;
  address: string | null;
  city: string | null;
  aadharNumber: string | null;
  panNumber: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
  loans: {
    id: string;
    status: string;
    principalAmount: number;
    outstandingAmount: number;
  }[];
  rdAccounts: { id: string; accountNumber: string }[];
}

const occupationOptions = [
  "SERVICE", "BUSINESS", "HOUSEWIFE", "STUDENT",
  "RETIRED", "PROFESSIONAL", "FARMER", "OTHER",
];

const relationshipOptions = [
  "Father", "Mother", "Spouse", "Son", "Daughter",
  "Brother", "Sister", "Other",
];

export default function AgentCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState(1); // Multi-step form

  const [form, setForm] = useState({
    // Personal
    title: "MR",
    name: "",
    fatherSpouseName: "",
    dateOfBirth: "",
    sex: "MALE",
    phone: "",
    email: "",
    address: "",
    city: "",
    pinCode: "",
    occupation: "SERVICE",
    aadharNumber: "",
    panNumber: "",
    // password: "",

    // Nominee
    nomineeName: "",
    nomineeRelationship: "",
    nomineeAge: "",
    nomineeDOB: "",
    nomineePAN: "",
    nomineeAadhar: "",
    nomineeContact: "",
    nomineeAddress: "",

    // Payment Settings
    paymentMode: "SINGLE",
    interestPayableOn: "MATURITY",

    // Introducer
    introducerName: "",
    introducerCode: "",
    introducerAddress: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/agent/customers");
        const data = await res.json();
        setCustomers(data);
        setFiltered(data);
      } catch {
        toast.error("Failed to fetch customers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const applySearch = () => {
      if (!search.trim()) {
        setFiltered(customers);
        return;
      }
      const q = search.toLowerCase();
      setFiltered(
        customers.filter(
          (c) =>
            c.user.name.toLowerCase().includes(q) ||
            c.user.phone.includes(q) ||
            c.customerCode.toLowerCase().includes(q)
        )
      );
    };
    applySearch();
  }, [search, customers]);

  const handleAddCustomer = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          nomineeAge: form.nomineeAge ? Number(form.nomineeAge) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(`Customer added! Code: ${data.customerCode}`);
      setAddOpen(false);
      setStep(1);
      setForm({
        title: "MR", name: "", fatherSpouseName: "",
        dateOfBirth: "", sex: "MALE", phone: "", email: "",
        address: "", city: "", pinCode: "", occupation: "SERVICE",
        aadharNumber: "", panNumber: "", 
        nomineeName: "", nomineeRelationship: "", nomineeAge: "",
        nomineeDOB: "", nomineePAN: "", nomineeAadhar: "",
        nomineeContact: "", nomineeAddress: "",
        paymentMode: "SINGLE", interestPayableOn: "MATURITY",
        introducerName: "", introducerCode: "", introducerAddress: "",
      });

      const updated = await fetch("/api/agent/customers");
      const updatedData = await updated.json();
      setCustomers(updatedData);
      setFiltered(updatedData);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const f = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">My Customers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage customers assigned to you
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setStep(1); }}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 gap-2">
              <UserPlus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Add New Customer — Step {step} of 3
              </DialogTitle>
              {/* Step indicator */}
              <div className="flex gap-2 pt-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${
                      s <= step ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {step === 1 && "Personal Details"}
                {step === 2 && "Nominee Details"}
                {step === 3 && "Payment & Introducer Details"}
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-2">

              {/* ── STEP 1: Personal Details ── */}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Select value={form.title} onValueChange={(v) => f("title", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MR">Mr</SelectItem>
                          <SelectItem value="MRS">Mrs</SelectItem>
                          <SelectItem value="MISS">Miss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter full name" value={form.name}
                        onChange={(e) => f("name", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Father / Spouse Name</Label>
                    <Input placeholder="Father or spouse name" value={form.fatherSpouseName}
                      onChange={(e) => f("fatherSpouseName", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input type="date" value={form.dateOfBirth }
                        onChange={(e) => f("dateOfBirth", e.target.value)} />
                    </div> */}

                    <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input 
                      type="date" 
                      defaultValue={form.dateOfBirth} // ✨ Change 'value' to 'defaultValue'
                      onChange={(e) => f("dateOfBirth", e.target.value)} 
                      max="9999-12-31" // Prevents the year field from glitching when typing
                    />
                  </div>
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={form.sex} onValueChange={(v) => f("sex", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input placeholder="Full address" value={form.address}
                      onChange={(e) => f("address", e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input placeholder="City" value={form.city}
                        onChange={(e) => f("city", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Pin Code</Label>
                      <Input placeholder="Pin code" value={form.pinCode}
                        onChange={(e) => f("pinCode", e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Contact No *</Label>
                      <Input placeholder="10-digit phone" value={form.phone}
                        maxLength={10}
                        onChange={(e) => f("phone", e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="Email" value={form.email}
                        onChange={(e) => f("email", e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Select value={form.occupation} onValueChange={(v) => f("occupation", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {occupationOptions.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o.charAt(0) + o.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Aadhar No</Label>
                      <Input placeholder="12-digit Aadhar" value={form.aadharNumber}
                        maxLength={12}
                        onChange={(e) => f("aadharNumber", e.target.value.replace(/\D/g, ""))} />
                    </div>
                    <div className="space-y-2">
                      <Label>PAN No</Label>
                      <Input placeholder="PAN number" value={form.panNumber}
                        onChange={(e) => f("panNumber", e.target.value.toUpperCase())} />
                    </div>
                  </div>

                  {/* <div className="space-y-2">
                    <Label>Login Password *</Label>
                    <Input type="password" placeholder="Set login password" value={form.password}
                      onChange={(e) => f("password", e.target.value)} />
                  </div> */}

                  <Button className="w-full bg-slate-900 hover:bg-slate-700"
                    onClick={() => {
                      if (!form.name || !form.phone) {
                        toast.error("Name, phone and password are required");
                        return;
                      }
                      setStep(2);
                    }}>
                    Next — Nominee Details →
                  </Button>
                </>
              )}

              {/* ── STEP 2: Nominee Details ── */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nominee Name</Label>
                      <Input placeholder="Nominee full name" value={form.nomineeName}
                        onChange={(e) => f("nomineeName", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select value={form.nomineeRelationship}
                        onValueChange={(v) => f("nomineeRelationship", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {relationshipOptions.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input type="number" placeholder="Age" value={form.nomineeAge}
                        onChange={(e) => f("nomineeAge", e.target.value)} />
                    </div>
                    {/* <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input type="date" value={form.nomineeDOB}
                        onChange={(e) => f("nomineeDOB", e.target.value)} />
                    </div> */}
                    <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input 
                      type="date" 
                      defaultValue={form.nomineeDOB} // ✨ Change 'value' to 'defaultValue'
                      onChange={(e) => f("nomineeDOB", e.target.value)} 
                      max="9999-12-31"
                    />
                  </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nominee PAN</Label>
                      <Input placeholder="PAN number" value={form.nomineePAN}
                        onChange={(e) => f("nomineePAN", e.target.value.toUpperCase())} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nominee Aadhar</Label>
                      <Input placeholder="12-digit Aadhar" value={form.nomineeAadhar}
                        maxLength={12}
                        onChange={(e) => f("nomineeAadhar", e.target.value.replace(/\D/g, ""))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Nominee Contact</Label>
                    <Input placeholder="10-digit phone" value={form.nomineeContact}
                      maxLength={10}
                      onChange={(e) => f("nomineeContact", e.target.value.replace(/\D/g, ""))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Nominee Address</Label>
                    <Input placeholder="Full address" value={form.nomineeAddress}
                      onChange={(e) => f("nomineeAddress", e.target.value)} />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      ← Back
                    </Button>
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-700"
                      onClick={() => setStep(3)}>
                      Next — Payment Details →
                    </Button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Payment & Introducer ── */}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={form.paymentMode} onValueChange={(v) => f("paymentMode", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">Single</SelectItem>
                        <SelectItem value="JOINTLY">Jointly</SelectItem>
                        <SelectItem value="EITHER_SURVIVOR">Either / Survivor</SelectItem>
                        <SelectItem value="NATURAL_GUARDIAN">Natural Guardian on Behalf of Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Interest Payable On</Label>
                    <Select value={form.interestPayableOn}
                      onValueChange={(v) => f("interestPayableOn", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATURITY">Maturity</SelectItem>
                        <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                      Introducer Details
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Introducer Name</Label>
                        <Input placeholder="Introducer name" value={form.introducerName}
                          onChange={(e) => f("introducerName", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Introducer Code</Label>
                        <Input placeholder="Introducer code" value={form.introducerCode}
                          onChange={(e) => f("introducerCode", e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Introducer Address</Label>
                        <Input placeholder="Introducer address" value={form.introducerAddress}
                          onChange={(e) => f("introducerAddress", e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                      ← Back
                    </Button>
                    <Button
                      className="flex-1 bg-slate-900 hover:bg-slate-700"
                      onClick={handleAddCustomer}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                      ) : (
                        "Add Customer"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name, phone or customer code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customers Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Customers ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No customers yet. Add your first customer!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">City</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Active Loans</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Outstanding</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => {
                    const activeLoans = customer.loans.filter(
                      (l) => l.status === "ACTIVE"
                    );
                    const totalOutstanding = activeLoans.reduce(
                      (sum, l) => sum + l.outstandingAmount,
                      0
                    );
                    return (
                      <tr key={customer.id}
                        className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium text-slate-800">{customer.user.name}</p>
                            <p className="text-slate-400 text-xs">{customer.user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono text-slate-600">{customer.customerCode}</td>
                        <td className="py-3 px-2 text-slate-600">{customer.user.phone}</td>
                        <td className="py-3 px-2 text-slate-600">{customer.city ?? "—"}</td>
                        <td className="py-3 px-2 text-slate-600">{activeLoans.length}</td>
                        <td className="py-3 px-2 font-medium text-slate-700">
                          {formatCurrency(totalOutstanding)}
                        </td>
                        <td className="py-3 px-2 text-slate-500">{formatDate(customer.createdAt)}</td>
                        <td className="py-3 px-2">
                          <Badge className={customer.user.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-red-100 text-red-700 hover:bg-red-100"}>
                            {customer.user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}