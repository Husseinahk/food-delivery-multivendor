"use client";

// Orda is a single-restaurant white-label deployment. The upstream Enatega
// marketing footer ("Partner with Enatega", app-store badges, social) does
// not belong in a restaurant's own customer app. This is a minimal footer:
// the restaurant's name + the legally required links (DE: Datenschutz / AGB;
// Impressum is wired in the legal workstream).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConfig } from "@/lib/context/configuration/configuration.context";

const AppFooter = () => {
  const pathname = usePathname();
  const { RESTAURANT_NAME } = useConfig();

  const isDiscoveryPage =
    pathname?.endsWith("/restaurants") ||
    pathname?.endsWith("/discovery") ||
    pathname?.endsWith("/store");

  const year = new Date().getFullYear();
  const brand = RESTAURANT_NAME || "";

  // German legal link names are fixed German terms (no i18n needed).
  // Impressum is wired in the legal workstream (#151 / legal scaffold).
  const legalLinks = [
    { label: "Datenschutz", href: "/privacy" },
    { label: "AGB", href: "/terms" },
  ];

  return (
    <footer
      className={`w-full h-auto bg-[#141414] text-gray-300 flex items-center justify-center ${
        isDiscoveryPage ? "md:pb-0 pb-20" : ""
      }`}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-8 flex flex-col sm:flex-row items-center sm:justify-between gap-4">
        <span className="font-semibold text-white">{brand}</span>

        <nav className="flex items-center gap-5 text-sm">
          {legalLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hover:text-white transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <span className="text-xs text-gray-500">
          © {year} {brand}
        </span>
      </div>
    </footer>
  );
};

AppFooter.displayName = "AppFooter";

export default AppFooter;
