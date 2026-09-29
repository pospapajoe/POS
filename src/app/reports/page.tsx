import { getSession } from "../actions";
import { prisma } from "@/lib/prisma";
import ReportClient from "./ReportClient";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const transactionsRaw = await prisma.transaction.findMany({
    include: { items: { include: { product: true } }, user: true },
    orderBy: { createdAt: 'desc' }
  });

  const productsRaw = await prisma.product.findMany();

  const shiftsRaw = await prisma.shift.findMany({
    include: { user: true },
    orderBy: { startTime: 'desc' }
  });

  const transactions = transactionsRaw.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString()
  }));

  const shifts = shiftsRaw.map(s => ({
    ...s,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime?.toISOString() || null
  }));

  const products = productsRaw.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <ReportClient transactions={transactions} shifts={shifts} products={products} />;
}
