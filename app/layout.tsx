import type { Metadata, Viewport } from "next";
import { Cinzel, Inter } from "next/font/google";
import { Bienvenida } from "@/components/Bienvenida";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Fortaleza Barbería",
  description: "Mira qué tan lleno está, aparta tu cita y gana cortes gratis.",
  appleWebApp: { capable: true, title: "La Fortaleza", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#0f1115",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${cinzel.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans">
        <Bienvenida />
        {children}
      </body>
    </html>
  );
}
