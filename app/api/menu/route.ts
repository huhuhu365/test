import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { dishes } from "../../../db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(dishes).where(eq(dishes.isActive, true)).orderBy(asc(dishes.sortOrder), asc(dishes.id));
    return Response.json({ dishes: rows });
  } catch {
    return Response.json({ error: "菜单暂时不可用", dishes: [] }, { status: 500 });
  }
}
