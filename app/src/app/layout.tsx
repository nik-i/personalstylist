import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FROCK — Your Personal Stylist",
  description: "AI-powered personal styling for your wardrobe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
