import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SeatingProvider } from "@/context/seating-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LITALICOワンダー 座席配置システム",
  description:
    "メンターごとのコース人数から教室座席の配置を自動で可視化するためのツールです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <SeatingProvider>{children}</SeatingProvider>
      </body>
    </html>
  );
}
