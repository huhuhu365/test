import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";
import { getChatGPTUser } from "../../../../chatgpt-auth";

const allowed = ["new", "preparing", "ready", "completed", "cancelled"];
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getChatGPTUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const id = Number((await params).id);
  const { status } = await request.json() as { status?: string };
  if (!Number.isInteger(id) || !status || !allowed.includes(status)) return Response.json({ error: "状态无效" }, { status: 400 });
  const [order] = await getDb().update(orders).set({ status }).where(eq(orders.id, id)).returning();
  return Response.json({ order });
}
