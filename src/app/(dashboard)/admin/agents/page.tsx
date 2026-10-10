"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { UserPlus, Trash2, KeyRound, Loader2, Users,RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
// import { UserPlus, Trash2, KeyRound, Loader2, Users, RefreshCw } from "lucide-react";
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

interface Agent {
  id: string;
  employeeCode: string;
  paymentType: string;
  salaryAmount: number | null;
  commissionRate: number | null;
  joinedAt: string;
  isActive: boolean;
  user: {
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
  };
  _count: {
    customers: number;
    loans: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // const [passwordLogs, setPasswordLogs] = useState<{
  // id: string;
  // newPassword: string;
  // changedAt: string;
  // seenByAdmin: boolean;
  // agent: { employeeCode: string; user: { name: string } };
  // }[]>([]);
  const [passwordLogs, setPasswordLogs] = useState<{
  id: string;
  changedAt: string;
  seenByAdmin: boolean;
  agent: { employeeCode: string; user: { name: string } };
}[]>([]);

  const router = useRouter();

  // Add Agent Form
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    paymentType: "SALARY",
    salaryAmount: "",
    commissionRate: "",
  });

  // Change Password Form
  const [newPassword, setNewPassword] = useState("");

 const fetchAgents = async () => {
  try {
    const res = await fetch("/api/admin/agents");
    const data = await res.json();
    setAgents(data);
  } catch {
    toast.error("Failed to fetch agents");
  } finally {
    setLoading(false);
  }
};

// useEffect(() => {
//   const loadAgents = async () => {
//     try {
//       const res = await fetch("/api/admin/agents");
//       const data = await res.json();
//       setAgents(data);
//     } catch {
//       toast.error("Failed to fetch agents");
//     } finally {
//       setLoading(false);
//     }
//   };
//   loadAgents();
// }, []);

useEffect(() => {
  const loadAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();
      setAgents(data);
    } catch {
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const loadPasswordLogs = async () => {
    try {
      const logsRes = await fetch("/api/admin/agent-password-logs");
      const logsData = await logsRes.json();
      setPasswordLogs(Array.isArray(logsData) ? logsData : []);
    } catch {
      toast.error("Failed to fetch password logs");
    }
  };

  loadAgents();
  loadPasswordLogs();
}, []);

  const handleAddAgent = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salaryAmount: form.salaryAmount ? parseFloat(form.salaryAmount) : null,
          commissionRate: form.commissionRate ? parseFloat(form.commissionRate) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success("Agent added successfully!");
      setAddOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
        paymentType: "SALARY",
        salaryAmount: "",
        commissionRate: "",
      });
      fetchAgents();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAgent = async (agent: Agent) => {
    if (!confirm(`Deactivate agent ${agent.user.name}?`)) return;

    try {
      const res = await fetch(`/api/admin/agents/${agent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Agent deactivated successfully");
      fetchAgents();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedAgent) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/agents/${selectedAgent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Password updated successfully");
      setPasswordOpen(false);
      setNewPassword("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivateAgent = async (agent: Agent) => {
  if (!confirm(`Reactivate agent ${agent.user.name}?`)) return;
  try {
    const res = await fetch(`/api/admin/agents/${agent.id}`, {
      method: "PUT",
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      return;
    }
    toast.success("Agent reactivated successfully");
    fetchAgents();
  } catch {
    toast.error("Something went wrong");
  }
  };

  const handleMarkSeen = async (id: string) => {
  await fetch("/api/admin/agent-password-logs", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  setPasswordLogs((prev) =>
    prev.map((log) =>
      log.id === id ? { ...log, seenByAdmin: true } : log
    )
  );
};

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Agents</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage all agents of Sree Shyam Financial
          </p>
        </div>

        {/* Add Agent Dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 gap-2">
              <UserPlus className="h-4 w-4" />
              Add Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  placeholder="Enter full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="agent@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="10-digit phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Set initial password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={form.paymentType}
                  onValueChange={(v) => setForm({ ...form, paymentType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY">Salary</SelectItem>
                    <SelectItem value="COMMISSION">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.paymentType === "SALARY" && (
                <div className="space-y-2">
                  <Label>Monthly Salary (₹)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 25000"
                    value={form.salaryAmount}
                    onChange={(e) => setForm({ ...form, salaryAmount: e.target.value })}
                  />
                </div>
              )}
              {form.paymentType === "COMMISSION" && (
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2.5"
                    value={form.commissionRate}
                    onChange={(e) => setForm({ ...form, commissionRate: e.target.value })}
                  />
                </div>
              )}
              <Button
                className="w-full bg-slate-900 hover:bg-slate-700"
                onClick={handleAddAgent}
                disabled={submitting}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                ) : (
                  "Add Agent"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : agents.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No agents added yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Employee Code</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Payment</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Customers</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Loans</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-slate-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-slate-800">{agent.user.name}</p>
                          <p className="text-slate-400 text-xs">{agent.user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-600">{agent.employeeCode}</td>
                      <td className="py-3 px-2 text-slate-600">{agent.user.phone}</td>
                      <td className="py-3 px-2">
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {agent.paymentType}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-1">
                            {agent.paymentType === "SALARY"
                              ? agent.salaryAmount
                                ? formatCurrency(agent.salaryAmount)
                                : "-"
                              : agent.commissionRate
                              ? `${agent.commissionRate}%`
                              : "-"}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-600">{agent._count.customers}</td>
                      <td className="py-3 px-2 text-slate-600">{agent._count.loans}</td>
                      <td className="py-3 px-2 text-slate-500">{formatDate(agent.joinedAt)}</td>
                      <td className="py-3 px-2">
                        <Badge
                          className={agent.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-red-100 text-red-700 hover:bg-red-100"
                          }
                        >
                          {agent.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:border-blue-300"
                            onClick={() => router.push(`/admin/agents/${agent.id}/report`)}
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setPasswordOpen(true);
                            }}
                          >
                            <KeyRound className="h-3 w-3" />
                          </Button>
                          {/* <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteAgent(agent)}
                            disabled={!agent.isActive}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button> */}
                          {agent.isActive ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleDeleteAgent(agent)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-700 hover:border-green-300"
                            onClick={() => handleReactivateAgent(agent)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-500">
              Changing password for <span className="font-medium text-slate-700">{selectedAgent?.user.name}</span>
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button
              className="w-full bg-slate-900 hover:bg-slate-700"
              onClick={handleChangePassword}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Password Change Logs */}
        {/* {passwordLogs.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                Agent Password Changes
                {passwordLogs.filter((l) => !l.seenByAdmin).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {passwordLogs.filter((l) => !l.seenByAdmin).length} new
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {passwordLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      !log.seenByAdmin
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {log.agent.user.name}
                        <span className="text-slate-400 text-xs ml-2">
                          {log.agent.employeeCode}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Changed on {formatDate(log.changedAt)}
                      </p>
                      <p className="text-sm font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-700">
                        New Password: {log.newPassword}
                      </p>
                    </div>
                    {!log.seenByAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleMarkSeen(log.id)}
                      >
                        Mark Seen
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )} */}
        {passwordLogs.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-amber-600" />
                Agent Password Changes
                {passwordLogs.filter((l) => !l.seenByAdmin).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {passwordLogs.filter((l) => !l.seenByAdmin).length} new
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {passwordLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      !log.seenByAdmin
                        ? "border-amber-200 bg-amber-50"
                        : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {log.agent.user.name}
                        <span className="text-slate-400 text-xs ml-2">
                          {log.agent.employeeCode}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Password changed on {formatDate(log.changedAt)}
                      </p>
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠️ Agent changed their own password — verify with agent if needed
                      </p>
                    </div>
                    {!log.seenByAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleMarkSeen(log.id)}
                      >
                        Mark Seen
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

    </div>
  );
}