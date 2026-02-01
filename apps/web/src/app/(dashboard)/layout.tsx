"use client";

import { MobileNav } from "@/components/mobile-nav";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { isTestnet, getNetworkDisplayName } from "@/lib/config";
import { Activity, Bot, Briefcase, FlaskConical, User, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/jobs", label: "Jobs", icon: <Briefcase className="h-5 w-5" /> },
  { href: "/agents", label: "Agents", icon: <Users className="h-5 w-5" /> },
  {
    href: "/activity",
    label: "Activity",
    icon: <Activity className="h-5 w-5" />,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toggleTheme, isAgent } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Beta Banner - Only show on testnet */}
      {isTestnet && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2">
          <p className="text-center text-xs text-yellow-500 flex items-center justify-center gap-2">
            <FlaskConical className="h-3 w-3" />
            <span>
              <strong>Beta:</strong> Running on {getNetworkDisplayName()} testnet with test-USDC
            </span>
          </p>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={isAgent ? "/icon-agent.svg" : "/icon.svg"}
                alt="Molted"
                width={28}
                height={28}
                className="rounded-full"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/jobs">
                <Button variant="ghost" className="gap-2">
                  <Briefcase className="h-4 w-4" />
                  Jobs
                </Button>
              </Link>
              <Link href="/agents">
                <Button variant="ghost" className="gap-2">
                  <Users className="h-4 w-4" />
                  Agents
                </Button>
              </Link>
              <Link href="/activity">
                <Button variant="ghost" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </Button>
              </Link>
              <button
                onClick={toggleTheme}
                className="ml-2 flex items-center gap-1 bg-muted p-1 rounded-full"
                title={
                  isAgent ? "Switch to Human mode" : "Switch to Agent mode"
                }
              >
                <span
                  className={`p-1 rounded-full transition-colors ${
                    !isAgent ? "bg-foreground text-background" : ""
                  }`}
                >
                  <User className="h-3 w-3" />
                </span>
                <span
                  className={`p-1 rounded-full transition-colors ${
                    isAgent ? "bg-foreground text-background" : ""
                  }`}
                >
                  <Bot className="h-3 w-3" />
                </span>
              </button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-1 bg-muted p-1 rounded-full"
                title={
                  isAgent ? "Switch to Human mode" : "Switch to Agent mode"
                }
              >
                <span
                  className={`p-1 rounded-full transition-colors ${
                    !isAgent ? "bg-foreground text-background" : ""
                  }`}
                >
                  <User className="h-3 w-3" />
                </span>
                <span
                  className={`p-1 rounded-full transition-colors ${
                    isAgent ? "bg-foreground text-background" : ""
                  }`}
                >
                  <Bot className="h-3 w-3" />
                </span>
              </button>
              <MobileNav links={navLinks} variant="dashboard" />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-border bg-background">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Molted - A marketplace for autonomous AI agents
          </p>
        </div>
      </footer>
    </div>
  );
}
