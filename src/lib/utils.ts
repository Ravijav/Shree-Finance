import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrismaClient } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Indian Rupees
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

// Format date to Indian format
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// Generate unique codes
export function generateLoanCode(): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `LN${timestamp}${random}`;
}

// export function generateCustomerCode(): string {
//   const timestamp = Date.now().toString().slice(-6);
//   const random = Math.floor(Math.random() * 1000)
//     .toString()
//     .padStart(3, "0");
//   return `CUST${timestamp}${random}`;
// }

export async function generateCustomerCode(prisma: PrismaClient): Promise<string> {
  const count = await prisma.customer.count();
  const number = (count + 1).toString().padStart(2, "0");
  return `SREECUST${number}`;
}

// export function generateEmployeeCode(): string {
//   const timestamp = Date.now().toString().slice(-4);
//   const random = Math.floor(Math.random() * 100)
//     .toString()
//     .padStart(2, "0");
//   return `EMP${timestamp}${random}`;
// }

export async function generateEmployeeCode(prisma: PrismaClient): Promise<string> {
  const count = await prisma.agent.count();
  const number = (count + 1).toString().padStart(2, "0");
  return `SREEAGENT${number}`;
}


// export function generateRDAccountNumber(): string {
//   const timestamp = Date.now().toString().slice(-8);
//   return `RD${timestamp}`;
// }

// Calculate EMI amount
// export function calculateEMI(
//   principal: number,
//   annualRate: number,
//   tenureMonths: number
// ): number {
//   const monthlyRate = annualRate / 12 / 100;
//   if (monthlyRate === 0) return principal / tenureMonths;
//   const emi =
//     (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
//     (Math.pow(1 + monthlyRate, tenureMonths) - 1);
//   return Math.round(emi * 100) / 100;
// }

// RD Daily Installment Calculator


// ─── RD Loan Calculator (Monthly Compounding) ────────────

// export function calculateRDLoanSummary(
//   principal: number,
//   annualRate: number,
//   tenureDays: number
// ) {
//   // Monthly compounding formula
//   const monthlyRate = annualRate / 12 / 100;
//   const numberOfMonths = tenureDays / 30;

//   // Maturity Amount = P × (1 + r)^n
//   const maturityAmount = principal * Math.pow(1 + monthlyRate, numberOfMonths);
//   const interest = maturityAmount - principal;
//   const dailyInstallment = maturityAmount / tenureDays;

//   return {
//     principal: Math.round(principal * 100) / 100,
//     interest: Math.round(interest * 100) / 100,
//     maturityAmount: Math.round(maturityAmount * 100) / 100,
//     dailyInstallment: Math.round(dailyInstallment * 100) / 100,
//     tenureDays,
//   };
// }

// export function calculateRDLoanSummary(
//   principal: number,
//   annualRate: number,
//   tenureDays: number
// ) {
//   if (!principal || !annualRate || !tenureDays) {
//     return null;
//   }

//   const monthlyRate = annualRate / 12 / 100;
//   const numberOfMonths = tenureDays / 30;

//   // Maturity Amount = P × (1 + r)^n
//   const maturityAmount =
//   principal * Math.pow(1 + monthlyRate, numberOfMonths);
//   const interest = maturityAmount - principal;
//   const dailyInstallment = maturityAmount / tenureDays;

//   return {
//     principal: Math.round(principal * 100) / 100,
//     interest: Math.round(interest * 100) / 100,
//     totalAmount: Math.round(maturityAmount * 100) / 100,  // ← was named maturityAmount before
//     dailyInstallment: Math.round(dailyInstallment * 100) / 100,
//     tenureDays,
//   };
// }

// export function calculateDailyInstallment(
//   principal: number,
//   annualRate: number,
//   tenureDays: number
// ): number {
//   const monthlyRate = annualRate / 12 / 100;
//   const numberOfMonths = tenureDays / 30;
//   const maturityAmount =
//     principal * Math.pow(1 + monthlyRate, numberOfMonths);
//   return Math.round((maturityAmount / tenureDays) * 100) / 100;
// }

// RD Loan Calculator (Simple Interest - 360 days) worrking for claude
// export function calculateRDLoanSummary(
//   principal: number,
//   annualRate: number,
//   tenureDays: number
// ) {
//   if (!principal || !annualRate || !tenureDays) {
//     return null;
//   }

//   // Simple Interest with 360 days per year
//   const interest = (principal * annualRate * tenureDays) / (360 * 100);
//   const totalAmount = principal + interest;
//   const dailyInstallment = totalAmount / tenureDays;

//   return {
//     principal: Math.round(principal * 100) / 100,
//     interest: Math.round(interest * 100) / 100,
//     totalAmount: Math.round(totalAmount * 100) / 100,
//     dailyInstallment: Math.round(dailyInstallment * 100) / 100,
//     tenureDays,
//   };
// }

// export function calculateDailyInstallment(
//   principal: number,
//   annualRate: number,
//   tenureDays: number
// ): number {
//   const interest = Math.round((principal * annualRate * tenureDays) / (360 * 100));
//   const totalAmount = principal + interest;
//   return Math.round((totalAmount / tenureDays) * 100) / 100;
// }

export function calculateRDLoanSummary(
  principal: number,
  annualRate: number,
  tenureDays: number
) {
  if (!principal || !annualRate || !tenureDays) {
    return null;
  }

  // Set up the variables for the compound interest formula
  // const rateAsDecimal = annualRate / 100;
  // const compoundingFrequency = 12; // Monthly compounding
  // const timeInYears = tenureDays / 365; // Standard 365-day year

  // A = P(1 + r/n)^(nt)
  // const totalAmount = principal * Math.pow(
  //   1 + rateAsDecimal / compoundingFrequency, 
  //   compoundingFrequency * timeInYears
  // );

  const flatRatePercentage = (annualRate*4)+100;
  const totalAmount= principal * (flatRatePercentage / 100);
  const interest = totalAmount - principal;
  const dailyInstallment = totalAmount / tenureDays;

  return {
    principal: Math.round(principal * 100) / 100,
    // Using Math.round() without decimals to match the integer output in the screenshot
    interest: Math.round(interest),
    totalAmount: Math.round(totalAmount),
    // Keeping 2 decimal places for daily installments if you still need this metric
    dailyInstallment: Math.round(dailyInstallment * 100) / 100,
    tenureDays,
  };
}

export function calculateDailyInstallment(
  principal: number,
  annualRate: number,
  tenureDays: number
): number {

  // const rateAsDecimal = annualRate / 100;
  // const compoundingFrequency = 12;
  // const timeInYears = tenureDays / 365;

  // const totalAmount = principal * Math.pow(
  //   1 + rateAsDecimal / compoundingFrequency, 
  //   compoundingFrequency * timeInYears
  // );

  const flatRatePercentage = annualRate*4;
  const totalAmount= principal * (flatRatePercentage / 100);
  
  return Math.round(totalAmount / tenureDays);
}

export function getDailyBreakdown(
  principal: number,
  annualRate: number,
  tenureDays: number
) {
  const flatRatePercentage = annualRate * 4 + 100;
  const totalAmount = principal * (flatRatePercentage / 100);
  const interest = totalAmount - principal;

  const principalPerDay = principal / tenureDays;
  const interestPerDay = interest / tenureDays;

  return {
    principalPerDay: Math.round(principalPerDay * 100) / 100,
    interestPerDay: Math.round(interestPerDay * 100) / 100,
  };
}

// ─── RD Account Calculator ────────────────────────────────

const RD_INTEREST_RATES: Record<number, number> = {
  1: 5.2,
  2: 9.0,
  3: 10.0,
  4: 10.5,
  5: 11.0,
};

export function getRDInterestRate(planYears: number): number {
  return RD_INTEREST_RATES[planYears] ?? 0;
}

// export function calculateRDAccount(
//   monthlyDeposit: number,
//   planYears: number
// ) {
//   const rate = getRDInterestRate(planYears);
//   const totalMonths = planYears * 12;
//   const totalPrincipal = monthlyDeposit * totalMonths;

//   // Simple Interest
//   const interestAmount =
//     (totalPrincipal * rate * planYears) / 100;

//   const maturityAmount = totalPrincipal + interestAmount;
//   const monthlyInterest = interestAmount / totalMonths;
//   const quarterlyInterest = interestAmount / (planYears * 4);

//   return {
//     planYears,
//     interestRate: rate,
//     totalMonths,
//     monthlyDeposit: Math.round(monthlyDeposit * 100) / 100,
//     totalPrincipal: Math.round(totalPrincipal * 100) / 100,
//     interestAmount: Math.round(interestAmount * 100) / 100,
//     maturityAmount: Math.round(maturityAmount * 100) / 100,
//     monthlyInterest: Math.round(monthlyInterest * 100) / 100,
//     quarterlyInterest: Math.round(quarterlyInterest * 100) / 100,
//   };
// }
export function calculateRDAccount(
  monthlyDeposit: number,
  planYears: number
)  {
  if (!monthlyDeposit || !planYears) return null;

  const rate = getRDInterestRate(planYears);
  const r = rate / 100;
  const n = 1; // Annual compounding
  const t = planYears;
  const totalMonths = planYears * 12;
  const totalPrincipal = monthlyDeposit * totalMonths;

  // RD Maturity Formula with annual compounding
  const numerator = Math.pow(1 + r / n, n * t) - 1;
  const denominator = 1 - Math.pow(1 + r / n, -1 / 12);
  const maturityAmount = monthlyDeposit * (numerator / denominator);
  const interestAmount = maturityAmount - totalPrincipal;

  return {
    planYears,
    interestRate: rate,
    totalMonths,
    monthlyDeposit: Math.round(monthlyDeposit * 100) / 100,
    totalPrincipal: Math.round(totalPrincipal * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    maturityAmount: Math.round(maturityAmount * 100) / 100,
  };
}

export function generateRDAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `SSRD${timestamp}`;
}