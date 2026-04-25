import { useState } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AppTopNav, MobileMenuButton } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AdminLeadsPage from "@/pages/admin-leads";
import ClientsPage from "@/pages/clients";
import ClientDetailPage from "@/pages/client-detail";
import ProjectsPage from "@/pages/projects";
import ProjectDetailPage from "@/pages/project-detail";
import SchedulePage from "@/pages/schedule";
import FollowUpsPage from "@/pages/follow-ups";
import ServicePage from "@/pages/service";
import NotFound from "@/pages/not-found";

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <AppTopNav isMobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      {/* Mobile top bar with hamburger */}
      <div className="mobile-top-bar md:hidden">
        <MobileMenuButton onClick={() => setMobileOpen(true)} />
        <span className="text-sm font-bold text-white">Budget Blinds North Dallas</span>
      </div>
      <main className="app-main">
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/admin-leads" component={AdminLeadsPage} />
          <Route path="/clients" component={ClientsPage} />
          <Route path="/clients/:id" component={ClientDetailPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/projects/:id" component={ProjectDetailPage} />
          <Route path="/schedule" component={SchedulePage} />
          <Route path="/follow-ups" component={FollowUpsPage} />
          <Route path="/service" component={ServicePage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router hook={useHashLocation}>
      <AppLayout />
    </Router>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}
