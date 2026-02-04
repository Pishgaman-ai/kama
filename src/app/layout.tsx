import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteChrome from "./components/SiteChrome";
import { ThemeProvider } from "./components/ThemeContext";

// Removed remote Google fonts (Geist, Geist Mono) to avoid network fetches during build

const vazirmatn = localFont({
  variable: "--font-vazirmatn",
  display: "swap",
  src: [
    {
      path: "../../fonts/webfonts/Vazirmatn[wght].woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
});

export const metadata: Metadata = {
  title: "کاما",
  description: "دستیار یادگیری هوشمند برای معلمان، دانش‌آموزان و والدین",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${vazirmatn.variable} antialiased`}
      >
        <ThemeProvider>
          <SiteChrome
            excludeRoutes={[
              "/signin",
              "/signup",
              "/forgot-password",
              "/reset-password",
              "/(auth)/*",
              "/not-found",
              "/dashboard",
              "/dashboard/*",
              "/admin",
              "/admin/*",
            ]}
          >
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
