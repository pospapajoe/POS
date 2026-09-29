import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { getStoreSetting } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pos_session");

  if (!sessionCookie) {
    redirect("/");
  }
  
  let session;
  try {
    session = JSON.parse(sessionCookie.value);
  } catch (e) {
    redirect("/");
  }

  if (session.role !== "ADMIN") {
    redirect("/pos"); // Hanya admin yang boleh buka pengaturan
  }

  const setting = await getStoreSetting();

  return <SettingsClient setting={setting} />;
}
