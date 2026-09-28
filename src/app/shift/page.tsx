import { getSession } from "../actions";
import { prisma } from "@/lib/prisma";
import ShiftClient from "./ShiftClient";
import { redirect } from "next/navigation";

export default async function ShiftPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const shift = await prisma.shift.findFirst({
    where: { userId: session.id, status: "OPEN" },
    include: { transactions: true }
  });

  // Convert dates to string for client component props
  const sanitizedShift = shift ? {
    ...shift,
    startTime: shift.startTime.toISOString(),
    endTime: shift.endTime?.toISOString() || null,
    transactions: shift.transactions.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString()
    }))
  } : null;

  return <ShiftClient shift={sanitizedShift} session={session} />;
}
