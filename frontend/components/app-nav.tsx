"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/members", label: "Members" },
  { href: "/loans", label: "Loans" }
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={isActive ? "nav-link nav-link-active" : "nav-link"}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
