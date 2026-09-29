"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  return await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function addProduct(data: { sku: string; barcode: string; name: string; hpp: number; price: number; category: string; stock: number; image: string }) {
  await prisma.product.create({
    data
  });
  revalidatePath("/", "layout");
}
export async function processTransaction(
  items: { id: string; quantity: number; price: number; hpp: number }[], 
  total: number, 
  paymentMethod: string,
  cashReceived: number | null,
  cashChange: number | null,
  userId: string
) {
  // Cari shift yang sedang berjalan untuk user ini
  let activeShift = await prisma.shift.findFirst({
    where: { userId, status: "OPEN" }
  });

  if (!activeShift) {
    activeShift = await prisma.shift.create({
      data: { userId, status: "OPEN" }
    });
  }

  const totalHpp = items.reduce((sum, item) => sum + (item.hpp * item.quantity), 0);
  const receiptNumber = `TRX-${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        receiptNumber,
        totalAmount: total,
        totalHpp,
        paymentMethod,
        cashReceived,
        cashChange,
        userId,
        shiftId: activeShift!.id,
        items: {
          create: items.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            priceAtTime: item.price,
            hppAtTime: item.hpp
          }))
        }
      }
    });

    if (paymentMethod === "CASH") {
      await tx.shift.update({
        where: { id: activeShift!.id },
        data: { expectedCash: { increment: total } }
      });
    } else {
      await tx.shift.update({
        where: { id: activeShift!.id },
        data: { expectedQris: { increment: total } }
      });
    }

    for (const item of items) {
      await tx.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } }
      });
    }
  });

  revalidatePath("/", "layout");
  return receiptNumber;
}

export async function processRetur(productId: string, qty: number, reason: string) {
  // (Optional) We could log the reason into a Retur table, but for now we just decrement stock
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: qty } }
  });
  
  revalidatePath("/", "layout");
}

export async function addStock(productId: string, qty: number) {
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: qty } }
  });
  
  revalidatePath("/", "layout");
}

// ================= USER & AUTH ACTIONS ================= //
import { cookies } from "next/headers";

export async function login(nik: string, password: string) {
  // Auto-seed admin if no users exist
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({
      data: { nik: "123456", password: "123", name: "Super Admin", role: "ADMIN" }
    });
  }

  const user = await prisma.user.findUnique({ where: { nik } });
  if (!user || user.password !== password) {
    throw new Error("NIK atau Password salah!");
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("pos_session", JSON.stringify({ id: user.id, name: user.name, role: user.role, nik: user.nik }), { secure: false });
  
  return user;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("pos_session");
  revalidatePath("/", "layout");
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("pos_session");
  if (!session) return null;
  return JSON.parse(session.value);
}

export async function getEmployees() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function addEmployee(data: { nik: string; name: string; password: string; role: string }) {
  await prisma.user.create({ data });
  revalidatePath("/employees");
}

export async function closeShift(shiftId: string, actualCash: number) {
  await prisma.shift.update({
    where: { id: shiftId },
    data: { 
      status: "CLOSED", 
      endTime: new Date(),
      actualCash 
    }
  });
  revalidatePath("/shift");
}

export async function processBatchRetur(items: { id: string; qty: number; reason: string }[]) {
  await prisma.$transaction(items.map(item => 
    prisma.product.update({
      where: { id: item.id },
      data: { stock: { decrement: item.qty } }
    })
  ));
  revalidatePath("/", "layout");
}

export async function processBatchInbound(items: { id: string; qty: number }[]) {
  await prisma.$transaction(items.map(item => 
    prisma.product.update({
      where: { id: item.id },
      data: { stock: { increment: item.qty } }
    })
  ));
  revalidatePath("/", "layout");
}

export async function getLastTransaction(userId: string) {
  const tx = await prisma.transaction.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: { product: true }
      },
      user: true
    }
  });

  if (!tx) return null;

  return {
    receiptNo: tx.receiptNumber,
    date: tx.createdAt.toLocaleString("id-ID"),
    items: tx.items.map(item => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.priceAtTime,
    })),
    subtotal: tx.totalAmount,
    total: tx.totalAmount,
    paymentMethod: tx.paymentMethod,
    cashReceived: tx.cashReceived,
    cashChange: tx.cashChange,
    cashierName: tx.user?.name || "Kasir"
  };
}

