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
  Bell,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { canSee } from "@/lib/roles";

const navItems = [
  { path: "/", label: "Dashboard", icon: "📊", section: "dashboard" },
  { path: "/admin-leads", label: "Lead Manager", icon: "📞", section: "lead-manager" },
  { path: "/clients", label: "Clients", icon: "👥", section: "clients" },
  { path: "/projects", label: "Projects", icon: "📋", section: "projects" },
  { path: "/schedule", label: "Schedule", icon: "📅", section: "schedule" },
  { path: "/follow-ups", label: "Follow-ups", icon: "🔄", section: "follow-ups" },
  { path: "/service", label: "Service & Repair", icon: "🔧", section: "service" },
];

/* ─── Top Header Bar ─── */
function TopHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="top-header">
      <div className="top-header-left">
        <span className="top-brand">
          Budget Blinds North Dallas
          <small>Team Operations Portal</small>
        </span>
      </div>
      <div className="top-header-right">
        {user && (
          <span className="top-user-info">
            {user.name} · {user.role}
          </span>
        )}
        <button className="top-logout-btn" onClick={() => logout()} title="Sign out">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

/* ─── Role Tab Navigation ─── */
function RoleNav({ onNavClick }: { onNavClick?: () => void }) {
  const [location] = useLocation();
  const { user } = useAuth();

  const visibleItems = navItems.filter(item => canSee(user?.role, item.section));

  return (
    <nav className="role-nav" aria-label="Main navigation">
      {visibleItems.map(({ path, label, icon, section }) => {
        const isActive = path === "/" ? location === "/" : location.startsWith(path);
        return (
          <Link
            key={path}
            href={path}
            onClick={onNavClick}
            data-testid={`nav-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
            className={cn("role-tab", isActive && "active")}
          >
            <span className="role-icon">{icon}</span>
            <span className="role-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ─── Mobile Drawer ─── */
function MobileDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const visibleItems = navItems.filter(item => canSee(user?.role, item.section));

  if (!isOpen) return null;

  return (
    <>
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="mobile-drawer">
        <div className="mobile-drawer-header">
          <span className="top-brand" style={{ fontSize: "16px" }}>Budget Blinds North Dallas</span>
          <button onClick={onClose} className="mobile-close-btn" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>
        {user && (
          <div className="mobile-user-info">
            <p className="font-semibold">{user.name}</p>
            <p className="text-xs opacity-70">{user.role}</p>
          </div>
        )}
        <nav className="mobile-nav">
          {visibleItems.map(({ path, label, icon }) => {
            const isActive = path === "/" ? location === "/" : location.startsWith(path);
            return (
              <Link
                key={path}
                href={path}
                onClick={onClose}
                className={cn("mobile-nav-item", isActive && "active")}
              >
                <span className="role-icon">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mobile-footer">
          <button onClick={() => { logout(); onClose(); }} className="mobile-nav-item">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Exports ─── */
interface TopNavProps {
  isMobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function AppTopNav({ isMobileOpen, setMobileOpen }: TopNavProps) {
  return (
    <>
      <TopHeader />
      {/* Desktop role tabs */}
      <div className="hidden md:block">
        <RoleNav />
      </div>
      {/* Mobile drawer */}
      <MobileDrawer isOpen={isMobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
      data-testid="button-mobile-menu"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}

// Keep old export for backwards compatibility
export { AppTopNav as AppSidebar };
