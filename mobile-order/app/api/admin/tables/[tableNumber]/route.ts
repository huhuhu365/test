import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getReadyDb } from "../../../../../db";
import { orderItems, orders } from "../../../../../db/schema";
import { getAdminUser } from "../../../../chatgpt-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tableNumber: string }> },
) {
  if (!await getAdminUser()) {
    return Response.json({ error: "请先登录后台" }, { status: 401 });
  }

  const tableNumber = Number((await params).tableNumber);
  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) {
    return Response.json({ error: "桌号不正确" }, { status: 400 });
  }

  const db = await getReadyDb();
  const activeOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.tableNumber, tableNumber),
        ne(orders.status, "cancelled"),
        ne(orders.paymentStatus, "paid"),
      ),
    )
    .orderBy(desc(orders.id));

  const ids = activeOrders.map((order) => order.id);
  const items = ids.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids))
    : [];

  const detailedOrders = activeOrders.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));

  return Response.json({
    table: {
      tableNumber,
      activeOrders: detailedOrders,
      requestedCheckout: detailedOrders.some(
        (order) => order.paymentStatus === "requested",
      ),
      total: detailedOrders.reduce((sum, order) => sum + order.total, 0),
      itemCount: detailedOrders.reduce(
        (sum, order) =>
          sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0,
      ),
    },
  });
}
