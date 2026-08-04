import { env } from "cloudflare:workers";
import { ensureDatabase } from "../../../../db";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  await ensureDatabase();
  const key = (await params).key.join("/");
  const image = await env.DB.prepare("SELECT content_type, data_base64 FROM dish_images WHERE key = ?").bind(key).first<{ content_type: string; data_base64: string }>();
  if (!image) return new Response("Not found", { status: 404 });
  const binary = atob(image.data_base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Response(bytes, { headers: { "content-type": image.content_type, "cache-control": "public, max-age=31536000, immutable" } });
}
