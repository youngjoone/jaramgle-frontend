import type { Metadata, Viewport } from "next";
import { Just_Another_Hand } from "next/font/google";
import "./globals.css";

const justAnotherHand = Just_Another_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-handwriting",
  display: "swap",
});

export const metadata: Metadata = {
  title: "자람글 - AI 동화책 생성",
  description: "AI로 나만의 특별한 동화책을 만들어보세요",
  keywords: ["동화책", "AI", "스토리북", "어린이", "그림책"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${justAnotherHand.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
