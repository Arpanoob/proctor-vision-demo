import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SuppressMediapipeInfo } from "./suppress-mediapipe-info";

export const metadata: Metadata = {
  title: "proctor-vision — Next.js demo",
  description: "AI-interview proctoring demo powered by the proctor-vision npm SDK",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><SuppressMediapipeInfo />{children}</body>
    </html>
  );
}
