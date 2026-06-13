"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Users,
  Calendar,
  ShieldCheck,
  Wrench,
  Mail,
  Building2,
  Banknote,
  Home,
  MessageSquare,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions";

type ViewMode = "styre" | "beboer";

const styreNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/saker", label: "Saker", icon: FileText },
  { href: "/moter", label: "Møter", icon: Calendar },
  { href: "/oppgaver", label: "Oppgaver", icon: BookOpen },
  { href: "/dokumenter", label: "Dokumenter", icon: FileText },
  { href: "/hms", label: "HMS", icon: ShieldCheck },
  { href: "/vedlikehold", label: "Vedlikehold", icon: Wrench },
  { href: "/okonomi", label: "Økonomi", icon: Banknote },
  { href: "/kommunikasjon", label: "Kommunikasjon", icon: Mail },
  { href: "/selskapet", label: "Selskapet", icon: Building2 },
  { href: "/beboere", label: "Beboere", icon: Users },
];

const beboerNavItems = [
  { href: "/", label: "Hjem", icon: Home },
  { href: "/min-bolig", label: "Min bolig", icon: Building2 },
  { href: "/oppslag", label: "Oppslag", icon: FileText },
  { href: "/meldinger", label: "Meldinger", icon: MessageSquare },
  { href: "/booking", label: "Booking", icon: Calendar },
  { href: "/dokumenter", label: "Dokumenter", icon: FileText },
];

export function Sidebar() {
  const [viewMode, setViewMode] = useState<ViewMode>("styre");
  const [collapsed, setCollapsed] = useState(false);

  const navItems = viewMode === "styre" ? styreNavItems : beboerNavItems;

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-zinc-950 border-r border-zinc-800 transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800">
        <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          MS
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-semibold text-zinc-100 text-sm truncate">
              Mitt Sameie
            </h1>
            <p className="text-xs text-zinc-500 truncate">
              Bryggepromenaden 1
            </p>
          </div>
        )}
      </div>

      {/* Role Toggle */}
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="flex rounded-lg bg-zinc-900 p-0.5">
          <button
            onClick={() => setViewMode("styre")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
              viewMode === "styre"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {collapsed ? "S" : "Styret"}
          </button>
          <button
            onClick={() => setViewMode("beboer")}
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-md transition-colors",
              viewMode === "beboer"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {collapsed ? "B" : "Beboer"}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors group"
          >
            <item.icon className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* AI Assistant Button */}
      <div className="px-3 py-3 border-t border-zinc-800">
        <Link
          href="/ai"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          {!collapsed && "Spør AI"}
        </Link>
      </div>

      {/* Bottom Actions */}
      <div className="px-3 py-2 border-t border-zinc-800 space-y-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Skjul meny</span>
            </>
          )}
        </button>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logg ut</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
