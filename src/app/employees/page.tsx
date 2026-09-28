import EmployeeClient from "./EmployeeClient";
import { getEmployees, getSession } from "../actions";
import { redirect } from "next/navigation";

export default async function EmployeesPage() {
  const session = await getSession();
  
  if (!session || session.role !== "ADMIN") {
    redirect("/"); // Kick out non-admins
  }

  const employees = await getEmployees();
  
  return <EmployeeClient initialEmployees={employees as any} />;
}
