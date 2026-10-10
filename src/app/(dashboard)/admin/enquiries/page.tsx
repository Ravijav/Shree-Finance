"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, MessageSquare, Phone, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  loanType: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  RESOLVED: "bg-green-100 text-green-700",
};

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/enquiries");
        const data = await res.json();
        setEnquiries(data);
      } catch {
        toast.error("Failed to fetch enquiries");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        toast.error("Failed to update status");
        return;
      }

      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
      toast.success("Status updated");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUpdating(null);
    }
  };

  const newCount = enquiries.filter((e) => e.status === "NEW").length;
  const contactedCount = enquiries.filter((e) => e.status === "CONTACTED").length;
  const resolvedCount = enquiries.filter((e) => e.status === "RESOLVED").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Enquiries</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage enquiries submitted from the website
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">New</p>
            <p className="text-2xl font-bold text-blue-600">{newCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Contacted</p>
            <p className="text-2xl font-bold text-amber-600">{contactedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <p className="text-sm text-slate-500">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Enquiries List */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base text-slate-800 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            All Enquiries ({enquiries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : enquiries.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-10">
              No enquiries yet
            </p>
          ) : (
            <div className="space-y-4">
              {enquiries.map((enquiry) => (
                <div
                  key={enquiry.id}
                  className="border border-slate-100 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Name + Date */}
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-slate-800">
                          {enquiry.name}
                        </p>
                        <span className="text-xs text-slate-400">
                          {formatDate(enquiry.createdAt)}
                        </span>
                        {enquiry.loanType && (
                          <Badge variant="outline" className="text-xs">
                            {enquiry.loanType}
                          </Badge>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {enquiry.phone}
                        </span>
                        {enquiry.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {enquiry.email}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm text-slate-600 bg-slate-50 rounded p-3 border border-slate-100">
                        {enquiry.message}
                      </p>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-36">
                      <Badge className={`${statusColors[enquiry.status]} hover:${statusColors[enquiry.status]}`}>
                        {enquiry.status}
                      </Badge>
                      <Select
                        value={enquiry.status}
                        onValueChange={(v) => handleStatusChange(enquiry.id, v)}
                        disabled={updating === enquiry.id}
                      >
                        <SelectTrigger className="w-36 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NEW">New</SelectItem>
                          <SelectItem value="CONTACTED">Contacted</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      {updating === enquiry.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}