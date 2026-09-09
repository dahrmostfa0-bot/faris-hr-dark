 import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "فارس دحروج الذكي | نظام إدارة الموارد البشرية",
  description:
    "نظام ذكي لإدارة الموظفين والحضور والإجازات والرواتب والعقود والملفات والتوظيف في منصة واحدة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className={`${plexArabic.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
