"use client";

import Link from "next/link";
import {
  Landmark, Phone, Mail, MapPin, Globe, IndianRupee,
  Shield, Home, TrendingUp, Car, Briefcase, MessageCircle,
  ArrowRight, Star, CheckCircle2, Clock, FileText, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  { icon: IndianRupee, title: "Loan Services", description: "Quick and hassle-free personal loans with minimal documentation and fast approval.", color: "bg-blue-50 text-blue-600" },
  { icon: Shield, title: "Insurance Solutions", description: "Comprehensive insurance plans to protect you and your family's future.", color: "bg-green-50 text-green-600" },
  { icon: Home, title: "Home Loan Solutions", description: "Make your dream home a reality with our flexible home loan options.", color: "bg-amber-50 text-amber-600" },
  { icon: TrendingUp, title: "Business Loan Solutions", description: "Fuel your business growth with our tailored business loan products.", color: "bg-purple-50 text-purple-600" },
  { icon: Car, title: "Vehicle Loan Solutions", description: "Drive your dream vehicle with easy EMIs and competitive interest rates.", color: "bg-red-50 text-red-600" },
  { icon: Briefcase, title: "LP / PL Services", description: "Loan against property and personal loan services for all your needs.", color: "bg-teal-50 text-teal-600" },
];

const whyUs = [
  { icon: CheckCircle2, title: "विकास हमारा, विश्वास आपका", subtitle: "Your growth, our trust" },
  { icon: Clock, title: "तेज प्रक्रिया, त्वरित समाधान", subtitle: "Fast process, quick solutions" },
  { icon: FileText, title: "न्यूनतम दस्तावेज, आसान प्रक्रिया", subtitle: "Minimal documents, easy process" },
  { icon: Users, title: "आपकी प्रगति, हमारा प्रयास", subtitle: "Your progress, our effort" },
];

const WHATSAPP_NUMBER = "918318359924";

export default function HomePage() {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20Shree%20Shyam%20Financial%20Services%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`;

  return (
    <div className="min-h-screen bg-white">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-lg">
              <Landmark className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Shree Shyam</p>
              <p className="text-amber-400 text-xs">Financial Services</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/enquiry">
              <Button variant="outline" size="sm" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-slate-900 text-xs">
                Enquire Now
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase">॥ श्री श्याम कृपा ॥</p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            Shree Shyam <span className="text-amber-400">Financial Services</span>
          </h1>
          <p className="text-slate-300 text-lg font-medium tracking-wide">— YOUR TRUST, OUR COMMITMENT —</p>
          <p className="text-slate-400 max-w-2xl mx-auto">
            One stop solution for all your financial needs. From personal loans to business loans, insurance to investments — we have got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/enquiry">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-white gap-2 w-full sm:w-auto">
                Apply for Loan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-green-400 text-green-400 hover:bg-green-400 hover:text-slate-900 gap-2 w-full sm:w-auto">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-sm font-medium uppercase tracking-wider mb-2">What We Offer</p>
            <h2 className="text-3xl font-bold text-slate-900">Our Services</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              We provide a wide range of financial services tailored to meet your personal and business needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-3">
                    <div className={`w-12 h-12 rounded-xl ${service.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{service.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{service.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Banner */}
      <section className="bg-slate-900 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
          <p className="text-white font-semibold text-lg tracking-wide text-center">
            ONE STOP SOLUTION FOR ALL YOUR FINANCIAL NEEDS
          </p>
          <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-sm font-medium uppercase tracking-wider mb-2">Why Choose Us</p>
            <h2 className="text-3xl font-bold text-slate-900">विश्वास हमारा, प्रगति आपकी</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center space-y-3 p-6 rounded-xl border border-slate-100 hover:border-amber-200 hover:shadow-sm transition-all">
                  <div className="bg-amber-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-sm font-medium uppercase tracking-wider mb-2">Get In Touch</p>
            <h2 className="text-3xl font-bold">Contact Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <p className="text-amber-400 font-bold text-lg">Pankaj Singh Yadav</p>
                <p className="text-slate-400 text-sm">Business Partner</p>
              </div>
              <div className="space-y-3">
                <a href="tel:8318359924" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 text-amber-400" />
                  8318359924
                </a>
                <a href="mailto:shreeshyamfinancialservices@gmail.com" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 text-amber-400" />
                  shreeshyamfinancialservices@gmail.com
                </a>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  Azamgarh, Uttar Pradesh
                </div>
                <a href="https://www.shreeshyamfinancialservices.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                  <Globe className="h-4 w-4 text-amber-400" />
                  www.shreeshyamfinancialservices.com
                </a>
              </div>
            </div>
            <div className="space-y-4 flex flex-col justify-center">
              <p className="text-slate-300 text-sm">
                Ready to get started? Reach out to us and our team will get back to you shortly.
              </p>
              <Link href="/enquiry">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2">
                  Submit an Enquiry <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full border-green-400 text-green-400 hover:bg-green-400 hover:text-slate-900 gap-2">
                  <MessageCircle className="h-4 w-4" /> Message on WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-6 px-4 text-center text-xs">
        <p>© 2024 Shree Shyam Financial Services. All rights reserved. | Azamgarh, Uttar Pradesh</p>
        <p className="mt-1 text-slate-600">LOAN | INSURANCE | INVESTMENT | FINANCIAL CONSULTANCY | LP / PL SERVICES</p>
      </footer>

    </div>
  );
}