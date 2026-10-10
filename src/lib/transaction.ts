import { prisma } from "@/lib/prisma";
import { TransactionType, TransactionStatus, Prisma } from "@prisma/client";

function generateTransactionCode(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `TXN${timestamp}${random}`;
}

interface CreateTransactionParams {
  type: TransactionType;
  status?: TransactionStatus;
  amount: number;
  customerId: string;
  agentId: string;
  loanId?: string;
  rdAccountId?: string;
  emiPaymentId?: string;
  outstandingBefore?: number;
  outstandingAfter?: number;
  remarks?: string;
}

type PrismaTransactionClient = Prisma.TransactionClient;

export async function createTransaction(
  params: CreateTransactionParams,
  tx?: PrismaTransactionClient
) {
  const db = tx ?? prisma;
  return await db.transaction.create({
    data: {
      transactionCode: generateTransactionCode(),
      type: params.type,
      status: params.status ?? TransactionStatus.SUCCESS,
      amount: params.amount,
      customerId: params.customerId,
      agentId: params.agentId,
      loanId: params.loanId ?? null,
      rdAccountId: params.rdAccountId ?? null,
      outstandingBefore: params.outstandingBefore ?? 0,
      outstandingAfter: params.outstandingAfter ?? 0,
      remarks: params.remarks ?? null,
    },
  });
}