import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanctuary Social",
  description: "A clean social space for devotionals, prayer requests, and honest encouragement."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
