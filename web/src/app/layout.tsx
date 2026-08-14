import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "@/components/ui/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Wardrobe Collective — Your Personal Stylist",
  description: "AI-powered personal styling for your wardrobe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
          <Toaster position="bottom-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
