import type { Metadata } from "next";
import { AuthGate } from "@/components/AuthGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kitchen-X Configurator",
  description:
    "AI-native kitchen design configurator with deterministic layouts, Konva previews, and Stripe checkout.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
