import { requireAdminUser } from "../chatgpt-auth";
import AdminDashboard from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  return <AdminDashboard userName={user.displayName} isLocal={user.userId === "local-admin"} publicOrigin={process.env.SITE_PUBLIC_ORIGIN ?? ""} />;
}
