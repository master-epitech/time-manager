import type { Metadata } from "next";
import { JetBrains_Mono, Lexend } from "next/font/google";
import "./globals.css";

/* Polices de la charte Lilas Pro, chargées et auto-hébergées par next/font. */
const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Time Manager",
  description: "Pointage et suivi du temps de travail — Trinity Market",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${lexend.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
