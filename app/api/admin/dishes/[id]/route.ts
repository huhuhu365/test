import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { dishes } from "../../../../../db/schema";
import { getAdminUser } from "../../../../chatgpt-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const id = Number((await params).id);
  const body = await request.json() as { name?: string; description?: string; price?: number; category?: string; imageUrl?: string | null; isActive?: boolean };
  if (!Number.isInteger(id)) return Response.json({ error: "菜品无效" }, { status: 400 });
  const [dish] = await getDb().update(dishes).set({ ...(body.name !== undefined && { name: body.name.trim().slice(0, 50) }), ...(body.description !== undefined && { description: body.description.trim().slice(0, 200) }), ...(body.price !== undefined && { price: body.price }), ...(body.category !== undefined && { category: body.category.trim().slice(0, 20) }), ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }), ...(body.isActive !== undefined && { isActive: body.isActive }) }).where(eq(dishes.id, id)).returning();
  return Response.json({ dish });
}
