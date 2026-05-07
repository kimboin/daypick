import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "날짜 맞추기",
  description: "초대코드로 친구들과 가능한 날짜를 모아 약속 후보를 찾는 일정 조율 서비스",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
