import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "小满食堂｜手机点单",
    description: "10 张桌位独立点单，店家实时接单和管理菜品。",
    openGraph: { title: "小满食堂", description: "手机点单 · 10桌独立下单", images: [image] },
    twitter: { card: "summary_large_image", title: "小满食堂", description: "手机点单 · 10桌独立下单", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
