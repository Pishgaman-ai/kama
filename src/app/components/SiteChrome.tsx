"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useTheme } from "./ThemeContext";

type SiteChromeProps = {
  children: React.ReactNode;
  /**
   * Routes that should NOT render navbar/footer. Supports exact paths and
   * prefix paths ending with '/*' (e.g., '/auth/*').
   */
  excludeRoutes?: string[];
};

type ChromeController = {
  setChromeHidden: (hidden: boolean) => void;
};

const ChromeControllerContext = React.createContext<ChromeController | null>(
  null
);

export function useChrome() {
  const ctx = React.useContext(ChromeControllerContext);
  if (!ctx) throw new Error("useChrome must be used within SiteChrome");
  return ctx;
}

function pathMatches(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }
  return pathname === pattern;
}

export default function SiteChrome({
  children,
  excludeRoutes = [],
}: SiteChromeProps) {
  const pathname = usePathname() || "/";
  const { theme } = useTheme();

  const shouldExclude = excludeRoutes.some((pattern) =>
    pathMatches(pathname, pattern)
  );

  const [scrolled, setScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [chromeHidden, setChromeHidden] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    // Close mobile menu on route change
    setMobileMenuOpen(false);
  }, [pathname]);

  const hideChrome = shouldExclude || chromeHidden;

  return (
    <ChromeControllerContext.Provider value={{ setChromeHidden }}>
      {!hideChrome && (
        <Navbar
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobile={() => setMobileMenuOpen((v) => !v)}
        />
      )}
      <main
        className={`min-h-screen ${
          theme === "dark" ? "bg-slate-950" : "bg-slate-50"
        }`}
      >
        {children}
      </main>
      {!hideChrome && <Footer />}
    </ChromeControllerContext.Provider>
  );
}
