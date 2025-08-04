"use client";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClientAuthProvider } from "@/components/client-auth-provider";

import logoImage from "@/public/logo.jpg";

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  showAuth?: boolean;
  logo?: React.ReactNode;
  links?: {
    href: string;
    label: string;
  }[];
}

export function Navbar({
  className,
  showAuth = true,
  logo = <Globe className="h-6 w-6" />,
  links = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ],
  ...props
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Footer links that can be shown in mobile menu
  const footerLinks = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms & Conditions" },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 px-4 py-3 backdrop-blur-md md:px-6",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImage.src} alt="Civix logo" className="h-8 w-8 object-cover rounded" />
            <span className="text-xl font-bold">Civix</span>
          </Link>
        </div>

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex md:items-center md:justify-center md:flex-1">
          <div className="flex gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Auth and Theme Toggle - Right Side */}
        <div className="hidden md:flex md:items-center md:gap-4">
          {showAuth && <ClientAuthProvider />}
          <ThemeToggle />
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mt-2 space-y-2 px-4 pb-3 md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-2 h-px bg-border" />

          {/* Footer links in mobile menu */}
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block py-2 text-sm text-muted-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {showAuth && <div className="py-2"><ClientAuthProvider /></div>}
        </div>
      )}
    </nav>
  );
} 