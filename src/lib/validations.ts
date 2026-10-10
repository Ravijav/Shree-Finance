import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().length(10, "Phone must be 10 digits").regex(/^\d+$/, "Phone must contain only digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  paymentType: z.enum(["SALARY", "COMMISSION"]),
  salaryAmount: z.number().positive().optional().nullable(),
  commissionRate: z.number().positive().max(100).optional().nullable(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().length(10, "Phone must be 10 digits").regex(/^\d+$/, "Phone must contain only digits"),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  address: z.string().optional(),
  aadharNumber: z.string().length(12, "Aadhar must be 12 digits").regex(/^\d+$/).optional().or(z.literal("")),
  panNumber: z.string().length(10, "PAN must be 10 characters").optional().or(z.literal("")),
});

export const createLoanSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  loanType: z.enum(["PERSONAL", "HOME", "VEHICLE", "BUSINESS", "INSURANCE"]),
  principalAmount: z.number().positive("Principal must be positive"),
  interestRate: z.number().positive().max(100, "Interest rate cannot exceed 100%"),
  tenureMonths: z.number().int().positive().max(360, "Tenure cannot exceed 360 months"),
  openRDAccount: z.boolean().optional(),
});

export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().length(10, "Phone must be 10 digits").regex(/^\d+$/, "Phone must contain only digits"),
  email: z.string().email().optional().or(z.literal("")),
  loanType: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});