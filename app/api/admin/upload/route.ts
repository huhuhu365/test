import { env } from "cloudflare:workers";
import { ensureDatabase } from "../../../../db";
import { getAdminUser } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ error: "请先登录" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 900 * 1024) return Response.json({ error: "图片处理后仍超过 900KB，请换一张图片" }, { status: 400 });
  await ensureDatabase();
  const key = `dish-${crypto.randomUUID()}`;
  const dataBase64 = arrayBufferToBase64(await file.arrayBuffer());
  await env.DB.prepare("INSERT INTO dish_images (key, content_type, data_base64) VALUES (?, ?, ?)").bind(key, file.type, dataBase64).run();
  return Response.json({ url: `/api/images/${key}` });
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return btoa(binary);
}
