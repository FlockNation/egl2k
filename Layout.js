import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Users, Calendar, BarChart3, Home, Medal, Zap, Gamepad2 } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
  },
  {
    title: "Quick Play",
    url: createPageUrl("QuickPlay"),
    icon: Zap,
  },
  {
    title: "Franchise Mode",
    url: createPageUrl("Franchise"),
    icon: Trophy,
  },
  {
    title: "Teams",
    url: createPageUrl("Teams"),
    icon: Users,
  },
  {
    title: "Schedule",
    url: createPageUrl("Schedule"),
    icon: Calendar,
  },
  {
    title: "Standings",
    url: createPageUrl("Standings"),
    icon: BarChart3,
  },
  {
    title: "Games Library",
    url: createPageUrl("GamesLibrary"),
    icon: Gamepad2,
  },
  {
    title: "Awards",
    url: createPageUrl("Awards"),
    icon: Medal,
  },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
        <Sidebar className="border-r border-slate-700 bg-slate-900/50 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">EGL 2K</h2>
                <p className="text-xs text-slate-400">Elite Gaming League</p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 py-2">
                Main Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        className={`hover:bg-slate-800/50 transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url 
                            ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-l-2 border-amber-400' 
                            : 'text-slate-300'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3 py-2.5">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800/50 p-2 rounded-lg transition-colors duration-200 text-slate-300" />
              <h1 className="text-xl font-bold text-white">EGL 2K</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
