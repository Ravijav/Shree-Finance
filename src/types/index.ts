import { DefaultSession } from "next-auth";
import {
  Role,
  LoanType,
  LoanStatus,
  PaymentStatus,
  AgentPaymentType,
  EnquiryStatus,
} from "@prisma/client";

// ─── NextAuth Type Extensions ────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      phone: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    phone: string;
  }

  interface JWT {
    id: string;
    role: Role;
    phone: string;
  }
}

// ─── Re-exports ──────────────────────────────────────────

export type {
  Role,
  LoanType,
  LoanStatus,
  PaymentStatus,
  AgentPaymentType,
  EnquiryStatus,
};

// ─── App Interfaces ──────────────────────────────────────

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
}

export interface LoanWithDetails {
  id: string;
  loanCode: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  status: LoanStatus;
  disbursedAt: Date | null;
  customer: {
    customerCode: string;
    user: { name: string; phone: string };
  };
  agent: {
    employeeCode: string;
    user: { name: string };
  };
}

export interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  pendingEMIs: number;
  overdueEMIs: number;
}