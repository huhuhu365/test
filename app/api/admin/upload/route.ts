import { env } from "cloudflare:workers";
import { getAdminUser } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 4 * 1024 * 1024) return Response.json({ error: "请选择小于 4MB 的图片" }, { status: 400 });
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  const key = `dishes/${crypto.randomUUID()}.${extension}`;
  await env.IMAGES.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  return Response.json({ url: `/api/images/${encodeURIComponent(key)}` });
}
