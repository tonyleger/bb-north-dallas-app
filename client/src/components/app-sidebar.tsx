import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarDays,
  PhoneForwarded,
  Wrench,
  Menu,
  X,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { canSee } from "@/lib/roles";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, section: "dashboard" },
  { path: "/admin-leads", label: "Lead Manager", icon: UserPlus, section: "lead-manager" },
  { path: "/clients", label: "Clients", icon: Users, section: "clients" },
  { path: "/projects", label: "Projects", icon: FolderKanban, section: "projects" },
  { path: "/schedule", label: "Schedule", icon: CalendarDays, section: "schedule" },
  { path: "/follow-ups", label: "Follow-ups", icon: PhoneForwarded, section: "follow-ups" },
  { path: "/service", label: "Service & Repair", icon: Wrench, section: "service" },
];

function BudgetBlindsLogo() {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-9 h-9 flex-shrink-0"
      aria-label="Budget Blinds logo"
    >
      {/* Window frame */}
      <rect x="3" y="3" width="34" height="34" rx="4" fill="#1A2332" stroke="#76C8DF" strokeWidth="1.5" />
      {/* Pull cord */}
      <line x1="20" y1="5" x2="20" y2="10" stroke="#76C8DF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="11" r="1.5" fill="#76C8DF" />
      {/* Slats */}
      <rect x="7" y="13" width="26" height="3" rx="1.5" fill="#76C8DF" />
      <rect x="7" y="18" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.85" />
      <rect x="7" y="23" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.7" />
      <rect x="7" y="28" width="26" height="3" rx="1.5" fill="#76C8DF" opacity="0.55" />
    </svg>
  );
}

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(item => canSee(user?.role, item.section));

  const handleLogout = async () => {
    await logout();
    onNavClick?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="px-4 py-5 flex items-center gap-3 border-b border-sidebar-border">
        <BudgetBlindsLogo />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white leading-tight">Budget Blinds</div>
          <div className="text-xs text-sidebar-foreground/70 leading-tight">North Dallas</div>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-3 py-3 text-xs text-sidebar-foreground/70 border-b border-sidebar-border/50">
          <p className="font-medium text-sidebar-foreground">{user.name}</p>
          <p className="text-xs text-sidebar-foreground/60">{user.role}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {visibleItems.map(({ path, label, icon: Icon, section }) => {
          const isActive = path === "/" ? location === "/" : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              onClick={onNavClick}
              data-testid={`nav-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
              )}
            >
              <Icon
                className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60")}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-sidebar-border/50 space-y-2">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white"
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-sidebar-foreground/60" />
          Logout
        </button>
        <div className="px-3 py-2 text-xs text-sidebar-foreground/50">
          <div className="font-medium text-sidebar-foreground/70">Budget Blinds North Dallas</div>
          <div className="mt-0.5">Powered by Home Franchise Concepts</div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar({ isMobileOpen, setMobileOpen }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 bg-sidebar h-screen sticky top-0 flex-shrink-0"
        data-testid="sidebar-desktop"
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform duration-300",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="sidebar-mobile"
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent transition-colors"
            data-testid="button-close-sidebar"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
      data-testid="button-mobile-menu"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
