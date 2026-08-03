import { adminCookieName } from "../../../chatgpt-auth";

export async function GET(request: Request) {
  const response = Response.redirect(new URL("/admin/login", request.url));
  response.headers.append("set-cookie", `${adminCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  return response;
}
