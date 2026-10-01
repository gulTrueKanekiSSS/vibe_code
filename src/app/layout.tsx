import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Studyspace — учись с пониманием",
    template: "%s · Studyspace",
  },
  description:
    "Личная учебная система: объяснения на русском, английские термины, практика и прогресс.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
