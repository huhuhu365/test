import { and, eq, inArray, ne } from "drizzle-orm";
import { getReadyDb } from "../../../db";
import { orderItems, orders } from "../../../db/schema";
import { getTableByToken } from "../../table-config";

async function getBill(seatToken: string) {
  const table = getTableByToken(seatToken);
  if (!table) return null;
  const db = await getReadyDb();
  const rows = await db.select().from(orders).where(and(eq(orders.tableNumber, table.number), ne(orders.paymentStatus, "paid"), ne(orders.status, "cancelled")));
  const ids = rows.map((order) => order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return {
    tableNumber: table.number,
    orders: rows.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })),
    total: rows.reduce((sum, order) => sum + order.total, 0),
    checkoutRequested: rows.some((order) => order.paymentStatus === "requested"),
  };
}

export async function GET(request: Request) {
  const bill = await getBill(new URL(request.url).searchParams.get("token") ?? "");
  if (!bill) return Response.json({ error: "桌位二维码无效" }, { status: 400 });
  return Response.json({ bill });
}

export async function POST(request: Request) {
  const { seatToken } = await request.json() as { seatToken?: string };
  const table = getTableByToken(seatToken ?? "");
  if (!table) return Response.json({ error: "桌位二维码无效" }, { status: 400 });
  const db = await getReadyDb();
  const bill = await getBill(table.token);
  if (!bill?.orders.length) return Response.json({ error: "本桌目前没有待结账订单" }, { status: 400 });
  const now = new Date().toISOString();
  await db.update(orders).set({ paymentStatus: "requested", checkoutRequestedAt: now }).where(and(eq(orders.tableNumber, table.number), eq(orders.paymentStatus, "unpaid"), ne(orders.status, "cancelled")));
  return Response.json({ bill: await getBill(table.token) });
}
