import { asc } from "drizzle-orm";
import { getReadyDb } from "../../../../db";
import { dishes } from "../../../../db/schema";
import { getAdminUser } from "../../../chatgpt-auth";

export async function GET() {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const db = await getReadyDb();
  return Response.json({ dishes: await db.select().from(dishes).orderBy(asc(dishes.sortOrder), asc(dishes.id)) });
}

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const body = await request.json() as { name?: string; description?: string; price?: number; category?: string; imageUrl?: string | null };
  if (!body.name?.trim() || !Number.isInteger(body.price) || body.price! < 0) return Response.json({ error: "请填写正确的菜名和价格" }, { status: 400 });
  const db = await getReadyDb();
  const [dish] = await db.insert(dishes).values({ name: body.name.trim().slice(0, 50), description: (body.description ?? "").trim().slice(0, 200), price: body.price!, category: (body.category ?? "主食").trim().slice(0, 20), imageUrl: body.imageUrl ?? null }).returning();
  return Response.json({ dish }, { status: 201 });
}
