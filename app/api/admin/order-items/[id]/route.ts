import { eq } from "drizzle-orm";
import { getReadyDb } from "../../../../../db";
import { orderItems, orders } from "../../../../../db/schema";
import { getAdminUser } from "../../../../chatgpt-auth";

async function recalculateOrder(
  db: Awaited<ReturnType<typeof getReadyDb>>,
  orderId: number,
) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  if (!items.length) {
    const [order] = await db
      .update(orders)
      .set({ total: 0, status: "cancelled", paymentStatus: "unpaid" })
      .where(eq(orders.id, orderId))
      .returning();
    return { order, empty: true };
  }

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const [order] = await db
    .update(orders)
    .set({ total })
    .where(eq(orders.id, orderId))
    .returning();
  return { order, empty: false };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await getAdminUser()) {
    return Response.json({ error: "请先登录后台" }, { status: 401 });
  }

  const id = Number((await params).id);
  const { action } = (await request.json()) as { action?: "decrease" | "remove" };
  if (!Number.isInteger(id) || !action || !["decrease", "remove"].includes(action)) {
    return Response.json({ error: "参数不正确" }, { status: 400 });
  }

  const db = await getReadyDb();
  const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
  if (!item) {
    return Response.json({ error: "这道菜已经不存在了" }, { status: 404 });
  }

  if (action === "remove" || item.quantity <= 1) {
    await db.delete(orderItems).where(eq(orderItems.id, id));
    const result = await recalculateOrder(db, item.orderId);
    return Response.json({
      order: result.order,
      message: result.empty ? "这笔订单已清空并自动取消" : "已删除这道菜",
    });
  }

  await db
    .update(orderItems)
    .set({ quantity: item.quantity - 1 })
    .where(eq(orderItems.id, id));
  const result = await recalculateOrder(db, item.orderId);
  return Response.json({ order: result.order, message: "已减少一份" });
}
