import { isLocalRequest, localAdminCookie } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  if (!await isLocalRequest()) return Response.json({ error: "线上版本请使用 ChatGPT 登录" }, { status: 403 });
  const { username, password } = await request.json() as { username?: string; password?: string };
  if (username !== "admin" || password !== "123456") return Response.json({ error: "账号或密码不正确" }, { status: 401 });
  const response = Response.json({ ok: true });
  response.headers.append("set-cookie", `${localAdminCookie.name}=${localAdminCookie.value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`);
  return response;
}
