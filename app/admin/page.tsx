import { requireChatGPTUser } from "../chatgpt-auth";
import AdminDashboard from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  return <AdminDashboard userName={user.displayName} />;
}
