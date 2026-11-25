"use client";
import { useStore } from "@/lib/store";
import OperatorHome from "@/components/features/homes/OperatorHome";
import SupervisorHome from "@/components/features/homes/SupervisorHome";
import ManagerHome from "@/components/features/homes/ManagerHome";
import AdminHome from "@/components/features/homes/AdminHome";

/** Each role lands on a fundamentally different home screen. */
export default function Dashboard() {
  const role = useStore((s) => s.role);
  if (role === "operator") return <OperatorHome />;
  if (role === "supervisor") return <SupervisorHome />;
  if (role === "manager") return <ManagerHome />;
  return <AdminHome />;
}
