import type { Metadata, Viewport } from "next";
import { Courier_Prime, Libre_Franklin } from "next/font/google";
import "./globals.css";

const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Late Gate",
  description: "Flight-delay stubs paid in USDC on World Chain. Pick a flight, pick how late, get paid if it runs past the line.",
  applicationName: "Late Gate",
  appleWebApp: {
    capable: true,
    title: "Late Gate",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the sticky header and bottom CTAs extend into notch / home-indicator areas.
  viewportFit: "cover",
  themeColor: "#f1efea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${libreFranklin.variable} ${courierPrime.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
