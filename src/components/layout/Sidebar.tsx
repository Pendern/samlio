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
  Bell,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions";

type ViewMode = "styre" | "beboer";

const styreNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/saker", label: "Saker", icon: FileText },
  { href: "/moter", label: "Møter", icon: Calendar },
  { href: "/hms", label: "HMS", icon: ShieldCheck },
  { href: "/vedlikehold", label: "Vedlikehold", icon: Wrench },
  { href: "/okonomi", label: "Økonomi", icon: Banknote },
  { href: "/nybygg", label: "Nybygg", icon: Building2 },
  { href: "/fellesskap", label: "Fellesskap", icon: MessageSquare },
  { href: "/generalforsamling", label: "Generalforsamling", icon: Users },
  { href: "/drift", label: "Drift", icon: Settings2 },
  { href: "/oversikt", label: "Oversikt", icon: BookOpen },
  { href: "/statistikk", label: "Statistikk", icon: LayoutDashboard },
];

const beboerNavItems = [
  { href: "/beboer", label: "Hjem", icon: Home },
  { href: "/profil", label: "Min profil", icon: Building2 },
  { href: "/fellesskap", label: "Fellesskap", icon: MessageSquare },
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
      <Link href="/profil" className="flex items-center gap-3 px-4 py-5 border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
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
      </Link>

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

      {/* Varsler + AI */}
      <div className="px-2 py-2 border-t border-zinc-800 space-y-0.5">
        <Link
          href="/varsler"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors group"
        >
          <Bell className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" />
          {!collapsed && <span>Varsler</span>}
        </Link>
        <Link
          href="/innstillinger"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors group"
        >
          <svg className="w-4 h-4 flex-shrink-0 text-zinc-500 group-hover:text-zinc-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {!collapsed && <span>Innstillinger</span>}
        </Link>
      </div>
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
