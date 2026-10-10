"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Landmark, ArrowLeft, Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const WHATSAPP_NUMBER = "8318359924";

export default function EnquiryPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", loanType: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Shree%20Shyam%20Financial%20Services%2C%20My%20name%20is%20${encodeURIComponent(form.name || "there")}%20and%20I%20would%20like%20to%20enquire%20about%20${encodeURIComponent(form.loanType || "your services")}.`;

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.message) {
      toast.error("Name, phone and message are required");
      return;
    }
    if (form.phone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/home" className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Shree Shyam</p>
              <p className="text-amber-400 text-xs">Financial Services</p>
            </div>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12">

        <Link href="/home" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {submitted ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-10 pb-10 text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 p-4 rounded-full">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-green-800">Enquiry Submitted!</h2>
              <p className="text-green-700 text-sm max-w-sm mx-auto">
                Thank you {form.name}! Our team will contact you on <strong>{form.phone}</strong> shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700 gap-2 w-full">
                    <MessageCircle className="h-4 w-4" /> Also message on WhatsApp
                  </Button>
                </a>
                <Link href="/home">
                  <Button variant="outline" className="w-full">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-800">Submit an Enquiry</CardTitle>
              <p className="text-sm text-slate-500">
                Fill in your details and we will get back to you as soon as possible.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    maxLength={10}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Service Interested In</Label>
                <Select value={form.loanType} onValueChange={(v) => setForm({ ...form, loanType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERSONAL">Loan Services</SelectItem>
                    <SelectItem value="INSURANCE">Insurance Solutions</SelectItem>
                    <SelectItem value="HOME">Home Loan Solutions</SelectItem>
                    <SelectItem value="BUSINESS">Business Loan Solutions</SelectItem>
                    <SelectItem value="VEHICLE">Vehicle Loan Solutions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Your Message *</Label>
                <Textarea
                  placeholder="Tell us about your requirements..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 bg-slate-900 hover:bg-slate-700"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Enquiry"
                  )}
                </Button>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Instead
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}