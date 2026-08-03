import { desc, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { dishes, orderItems, orders } from "../../../db/schema";
import { getAdminUser } from "../../chatgpt-auth";

export async function GET() {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const db = getDb();
  const recentOrders = await db.select().from(orders).orderBy(desc(orders.id)).limit(100);
  const ids = recentOrders.map((order) => order.id);
  const items = ids.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, ids)) : [];
  return Response.json({ orders: recentOrders.map((order) => ({ ...order, items: items.filter((item) => item.orderId === order.id) })) });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { tableNumber?: number; note?: string; items?: { dishId: number; quantity: number }[] };
    if (!Number.isInteger(payload.tableNumber) || payload.tableNumber! < 1 || payload.tableNumber! > 10) return Response.json({ error: "桌号无效" }, { status: 400 });
    const cleanItems = (payload.items ?? []).filter((item) => Number.isInteger(item.dishId) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20);
    if (!cleanItems.length) return Response.json({ error: "请先选择菜品" }, { status: 400 });
    const db = getDb();
    const selectedDishes = await db.select().from(dishes).where(inArray(dishes.id, cleanItems.map((item) => item.dishId)));
    if (selectedDishes.length !== new Set(cleanItems.map((item) => item.dishId)).size) return Response.json({ error: "部分菜品已下架，请刷新菜单" }, { status: 409 });
    const total = cleanItems.reduce((sum, item) => sum + (selectedDishes.find((dish) => dish.id === item.dishId)?.price ?? 0) * item.quantity, 0);
    const orderNumber = `${String(payload.tableNumber).padStart(2, "0")}${String(Date.now()).slice(-5)}`;
    const [order] = await db.insert(orders).values({ orderNumber, tableNumber: payload.tableNumber!, note: (payload.note ?? "").trim().slice(0, 200), total }).returning();
    await db.insert(orderItems).values(cleanItems.map((item) => { const dish = selectedDishes.find((row) => row.id === item.dishId)!; return { orderId: order.id, dishId: dish.id, dishName: dish.name, unitPrice: dish.price, quantity: item.quantity }; }));
    return Response.json({ order }, { status: 201 });
  } catch {
    return Response.json({ error: "订单提交失败，请稍后重试" }, { status: 500 });
  }
}
