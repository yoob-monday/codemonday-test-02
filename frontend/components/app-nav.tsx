"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const memberLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/catalog", label: "Catalog" },
  { href: "/loans", label: "Loans" }
];

const librarianLinks = [
  { href: "/", label: "Admin Overview" },
  { href: "/catalog", label: "Inventory Desk" },
  { href: "/members", label: "Patron Registry" },
  { href: "/loans", label: "Circulation Control" }
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isReady, user, logout } = useAuth();

  if (!isReady || !user) {
    return (
      <nav className="nav nav-auth">
        <Link href="/login" className={pathname === "/login" ? "nav-link nav-link-active" : "nav-link"}>
          Login
        </Link>
        <Link
          href="/register"
          className={pathname === "/register" ? "nav-link nav-link-active" : "nav-link"}
        >
          Register
        </Link>
      </nav>
    );
  }

  const links = user.role === "librarian" ? librarianLinks : memberLinks;

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="nav-cluster">
      <nav className={`nav ${user.role === "librarian" ? "nav-librarian" : ""}`}>
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
      <div className={`nav-user ${user.role === "librarian" ? "nav-user-librarian" : ""}`}>
        <div>
          <strong>{user.name}</strong>
          <small>{user.role === "librarian" ? "Librarian Workspace" : "Student Workspace"}</small>
        </div>
        <button type="button" className="nav-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
