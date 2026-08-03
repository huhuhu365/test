import { and, eq, ne } from "drizzle-orm";
import { getReadyDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";
import { getAdminUser } from "../../../../chatgpt-auth";

export async function PATCH(_request: Request, { params }: { params: Promise<{ tableNumber: string }> }) {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const tableNumber = Number((await params).tableNumber);
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) return Response.json({ error: "桌号无效" }, { status: 400 });
  const db = await getReadyDb();
  const paidAt = new Date().toISOString();
  const paidOrders = await db.update(orders).set({ paymentStatus: "paid", paidAt }).where(and(eq(orders.tableNumber, tableNumber), ne(orders.paymentStatus, "paid"), ne(orders.status, "cancelled"))).returning();
  return Response.json({ paid: paidOrders.length, paidAt });
}
