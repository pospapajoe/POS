"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getStoreSetting() {
  let setting = await prisma.storeSetting.findUnique({
    where: { id: 1 }
  });
  
  if (!setting) {
    setting = await prisma.storeSetting.create({
      data: {
        id: 1,
        name: "EUODIA by Papa Joe's Food",
        address: "Jl. Contoh POS No. 123",
        phone: "0812-3456-7890",
        email: "hello@euodia.com"
      }
    });
  }
  return setting;
}

export async function updateStoreSetting(data: any) {
  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email
    },
    create: {
      id: 1,
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email
    }
  });
  
  revalidatePath("/");
  return { success: true };
}
