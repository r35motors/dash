"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  BadgeDollarSign,
  FileText,
  BarChart3,
  Settings,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Vehicles",
    href: "/vehicles",
    icon: Car,
  },
  {
    name: "Sales",
    href: "/sales",
    icon: BadgeDollarSign,
  },
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

  // Clear navigating state and close mobile menu when pathname updates
  React.useEffect(() => {
    setNavigatingTo(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleNavClick = (href: string) => {
    if (href !== pathname) {
      setNavigatingTo(href);
    }
  };

  const isItemActive = (href: string) => {
    if (navigatingTo) {
      return href === "/" ? navigatingTo === "/" : navigatingTo.startsWith(href);
    }
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const currentPage = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-white text-[#0F172A] flex flex-col md:flex-row antialiased">
      {/* Sleek Top Navigation Progress Bar for 0ms Perceived Response */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-[2.5px] z-50 transition-opacity duration-200 pointer-events-none",
          navigatingTo ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className={cn(
            "h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-400 transition-all duration-300 ease-out",
            navigatingTo ? "w-3/4 animate-pulse" : "w-full"
          )}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-200/80 bg-[#FAFAFB] h-screen sticky top-0 z-30 select-none">
        {/* Dealership Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200/80 bg-white gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center p-1.5 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="R35 MOTORS" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[14px] tracking-tight text-[#0F172A] truncate">
              R35 MOTORS
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest truncate">
              Dealership ERP
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Management
          </div>
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group cursor-pointer active:scale-[0.98]",
                  isActive
                    ? "bg-[#0F172A] text-white shadow-xs font-semibold"
                    : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-200/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-[#0F172A]"
                  )}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Database & System Info Footer */}
        <div className="p-3.5 border-t border-slate-200/80 bg-white/90">
          <div className="flex items-center gap-2.5 px-1 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-500" /> Supabase PostgreSQL
              </span>
              <span className="text-[10px] text-slate-400">
                Connected & Fast Cache Active
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center p-1 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="R35 MOTORS" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-sm text-[#0F172A]">R35 MOTORS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 active:scale-95 transition-transform"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col p-4 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center p-1 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-white.png" alt="R35 MOTORS" className="w-full h-full object-contain" />
                </div>
                <span className="font-bold text-sm text-[#0F172A]">R35 MOTORS</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    onClick={() => {
                      handleNavClick(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98]",
                      isActive
                        ? "bg-[#0F172A] text-white shadow-xs font-semibold"
                        : "text-slate-600 hover:text-[#0F172A] hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-[#E2E8F0] text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>R35 MOTORS</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar with Frosted Glass Layer */}
        <header className="hidden md:flex h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-slate-400">R35 MOTORS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-semibold text-slate-900 text-[13px]">
              {currentPage?.name || "Management"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Dealership
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-[#FFFFFF] overflow-y-auto pb-24 md:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar with iOS safe area and clear active states */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 flex items-center justify-around px-2 pt-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] h-[calc(3.85rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.03)] select-none">
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl text-[10px] font-medium transition-all relative active:scale-95",
                  isActive
                    ? "text-slate-950 font-bold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <div
                  className={cn(
                    "px-3 py-1 rounded-xl transition-all duration-150 flex items-center justify-center",
                    isActive
                      ? "bg-[#0F172A] text-white shadow-xs"
                      : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-500")} />
                </div>
                <span className={cn("truncate tracking-tight mt-0.5", isActive ? "font-semibold text-slate-950" : "text-slate-500")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
