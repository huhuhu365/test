import { adminCookieName } from "../../../chatgpt-auth";

export async function GET(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const headers = new Headers({
    "cache-control": "no-store, max-age=0",
  });
  headers.append(
    "set-cookie",
    `${adminCookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`,
  );
  return Response.json({ ok: true }, { headers });
}
