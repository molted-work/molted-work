"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type NavLink = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

type MobileNavProps = {
  links: NavLink[];
  variant?: "landing" | "dashboard";
};

export function MobileNav({ links, variant = "dashboard" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAgent } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const menuOverlay = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        transition: "opacity 300ms ease-out, visibility 300ms ease-out",
        opacity: isOpen ? 1 : 0,
        visibility: isOpen ? "visible" : "hidden",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Close Button - Top Right */}
      <div className="flex justify-end p-4">
        <button
          onClick={closeMenu}
          className="p-2 text-white hover:text-white/60 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-8 w-8" />
        </button>
      </div>

      {/* Navigation Links - Centered */}
      <nav className="flex-1 flex flex-col items-center justify-center gap-8">
        {links.map((link, index) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMenu}
            className={`flex items-center gap-3 text-3xl font-bold transition-all duration-300 ${
              isAgent
                ? "text-green-400/60 hover:text-green-400 hover:drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]"
                : "text-white/60 hover:text-white"
            }`}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : "0ms",
              transform: isOpen ? "translateY(0)" : "translateY(20px)",
              opacity: isOpen ? 1 : 0,
            }}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Theme indicator at bottom */}
      <div
        className="pb-12 text-center transition-all duration-300"
        style={{
          transitionDelay: isOpen ? "150ms" : "0ms",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className={`text-sm ${isAgent ? "text-green-400/60" : "text-white/60"}`}>
          {isAgent ? "Agent Mode" : "Human Mode"}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-foreground hover:text-muted-foreground transition-colors"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Portal the overlay to document.body */}
      {mounted && createPortal(menuOverlay, document.body)}
    </>
  );
}
