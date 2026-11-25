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
  ChevronRight,
  Database,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

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

// UI/UX Pro Max: Keep bottom navigation to <= 5 primary items for 44x44px+ touch comfort
const mobileBottomNavItems = navItems.slice(0, 5);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [navigatingTo, setNavigatingTo] = React.useState<string | null>(null);

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
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

  const currentPage = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-[#0F172A] dark:text-slate-50 flex flex-col md:flex-row antialiased transition-colors duration-200">
      {/* Sleek Top Navigation Progress Bar for 0ms Perceived Response */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed top-0 left-0 right-0 h-[2.5px] z-50 transition-opacity duration-200 pointer-events-none",
          navigatingTo ? "opacity-100" : "opacity-0"
        )}
      >
        <div
          className={cn(
            "h-full bg-gradient-to-r from-emerald-500 via-blue-600 to-slate-900 dark:to-sky-400 transition-all duration-300 ease-out",
            navigatingTo ? "w-3/4 animate-pulse" : "w-full"
          )}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col border-r border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 z-30 select-none shrink-0 transition-colors duration-200">
        {/* Dealership Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0F172A] dark:bg-slate-800 flex items-center justify-center p-1.5 shadow-xs shrink-0 border border-transparent dark:border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="R35 MOTORS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[15px] tracking-tight text-[#0F172A] dark:text-slate-50 truncate">
              R35 MOTORS
            </span>
            <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate">
              Dealership ERP
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main Navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Operations
          </div>
          {navItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F172A] dark:focus-visible:ring-sky-400",
                  isActive
                    ? "bg-[#0F172A] dark:bg-slate-800 text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    isActive
                      ? "text-emerald-400"
                      : "text-slate-400 dark:text-slate-500 group-hover:text-[#0F172A] dark:group-hover:text-slate-100"
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
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5 px-1 py-0.5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate">
                <Database className="w-3 h-3 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>Supabase PostgreSQL</span>
              </span>
              <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Connected &amp; Fast Cache
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header (Frosted Glass, >= 44px touch targets) */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 min-h-[44px] px-1 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] dark:bg-slate-800 flex items-center justify-center p-1 shadow-xs shrink-0 border border-transparent dark:border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="R35 MOTORS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-[#0F172A] dark:text-slate-50 leading-tight">R35 MOTORS</span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              {currentPage?.name || "Dashboard"}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          >
            {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link
            href="/settings"
            prefetch={true}
            onClick={() => handleNavClick("/settings")}
            aria-label="Dealership Settings"
            className={cn(
              "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95",
              isItemActive("/settings")
                ? "bg-[#0F172A] dark:bg-slate-800 text-white"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:scale-95 transition-transform cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-4 animate-in slide-in-from-left duration-200 border-r border-slate-200/80 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0F172A] dark:bg-slate-800 flex items-center justify-center p-1 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-white.png" alt="R35 MOTORS Logo" width={24} height={24} className="w-6 h-6 object-contain" />
                </div>
                <span className="font-bold text-sm text-[#0F172A] dark:text-slate-50">R35 MOTORS</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav aria-label="Mobile Drawer Navigation" className="flex-1 py-4 space-y-1.5">
              {navItems.map((item) => {
                const isActive = isItemActive(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => {
                      handleNavClick(item.href);
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3.5 min-h-[44px] rounded-xl text-sm font-medium transition-all active:scale-[0.98] cursor-pointer",
                      isActive
                        ? "bg-[#0F172A] dark:bg-slate-800 text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-400 dark:text-slate-500")} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Supabase Connected</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === "dark" ? "Light" : "Dark"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar with Frosted Glass Layer */}
        <header className="hidden md:flex h-16 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 dark:text-slate-500 tracking-wide">R35 MOTORS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <span className="font-semibold text-[#0F172A] dark:text-slate-100 text-[13px]">
              {currentPage?.name || "Management"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" />
                  <span>Dark</span>
                </>
              )}
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Dealership
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 bg-[#F8FAFC] dark:bg-[#020617] overflow-y-auto pb-24 md:pb-10 transition-colors duration-200">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Strictly <= 5 primary items per UI/UX Pro Max guidelines) */}
        <nav
          aria-label="Bottom Navigation"
          className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around px-2 pt-1.5 pb-[calc(0.45rem+env(safe-area-inset-bottom,0px))] h-[calc(4.15rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(15,23,42,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)] select-none"
        >
          {mobileBottomNavItems.map((item) => {
            const isActive = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                aria-current={isActive ? "page" : undefined}
                onClick={() => handleNavClick(item.href)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 min-h-[44px] py-1 px-1 rounded-xl text-[11px] font-medium transition-all relative active:scale-95 cursor-pointer",
                  isActive
                    ? "text-[#0F172A] dark:text-white font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-slate-200"
                )}
              >
                <div
                  className={cn(
                    "px-3.5 py-1 rounded-full transition-all duration-150 flex items-center justify-center",
                    isActive
                      ? "bg-[#0F172A] dark:bg-slate-800 text-white shadow-xs"
                      : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-500 dark:text-slate-400")} />
                </div>
                <span className={cn("truncate tracking-tight mt-0.5", isActive ? "font-semibold text-[#0F172A] dark:text-white" : "text-slate-500 dark:text-slate-400")}>
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
