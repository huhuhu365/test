import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "小满食堂｜手机点单",
  description: "小满食堂手机自助点单，选菜、加购并快速提交订单。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
