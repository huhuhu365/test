import { adminCookieName, getAdminPassword, getAdminSessionValue } from "../../../chatgpt-auth";

export async function POST(request: Request) {
  const { username, password } = await request.json() as { username?: string; password?: string };
  if (username !== "admin" || password !== getAdminPassword()) return Response.json({ error: "账号或密码不正确" }, { status: 401 });
  const response = Response.json({ ok: true });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  response.headers.append("set-cookie", `${adminCookieName}=${await getAdminSessionValue()}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${secure}`);
  return response;
}
