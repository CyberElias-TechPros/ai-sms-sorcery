/**
 * App shell — sidebar navigation + header with live quota status.
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, MessageSquare, Users, Calendar, Settings,
  Activity, LogOut, Menu, X, MessageCircle, BrainCircuit, FileText, Sparkles,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, active, onClick }: SidebarItemProps) => {
  return (
    <Link to={to} className="w-full" onClick={onClick}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 pl-3 font-normal transition-all duration-300",
          active
            ? "bg-primary/12 text-primary hover:bg-primary/15 shadow-[inset_2px_0_0_0_hsl(var(--primary))]"
            : "hover:bg-secondary text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon size={18} className={cn("transition-transform duration-300", active && "scale-110")} />
        <span>{label}</span>
      </Button>
    </Link>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobileView) setIsSidebarOpen(false);
  }, [location.pathname, isMobileView]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
    { icon: BrainCircuit, label: "AI Generator", to: "/ai-generator" },
    { icon: MessageCircle, label: "SMS Composer", to: "/sms-composer" },
    { icon: FileText, label: "Templates", to: "/message-templates" },
    { icon: Users, label: "Contacts", to: "/contacts" },
    { icon: Calendar, label: "Scheduled", to: "/scheduled" },
    { icon: MessageSquare, label: "Message Logs", to: "/message-logs" },
    { icon: Activity, label: "Analytics", to: "/analytics" },
    { icon: Settings, label: "Settings", to: "/settings" },
  ];

  if (location.pathname === "/auth") return <div className="min-h-screen">{children}</div>;

  const remaining = Math.max(0, (user?.messagesQuota ?? 0) - (user?.messagesUsed ?? 0));

  return (
    <div className="min-h-screen flex relative">
      {isSidebarOpen && isMobileView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed md:relative z-50 h-full flex flex-col bg-card/95 backdrop-blur border-r",
          "transition-transform duration-300 ease-out w-64",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <Link to="/dashboard" className="flex items-center">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-[hsl(322_76%_62%)] flex items-center justify-center mr-2.5 shadow-glow">
              <Sparkles size={15} className="text-white" />
            </span>
            <h1 className="font-display font-semibold text-lg tracking-tight">Sorcery</h1>
          </Link>
          {isMobileView && (
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} aria-label="Close menu">
              <X size={18} />
            </Button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1.5">
            {navItems.map((item) => (
              <SidebarItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                to={item.to}
                active={location.pathname === item.to}
                onClick={() => isMobileView && setIsSidebarOpen(false)}
              />
            ))}
          </div>
        </nav>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={logout}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      <main className={cn("flex-1 min-h-screen flex flex-col bg-background transition-all duration-300")}>
        <header className="h-16 border-b bg-card/70 backdrop-blur-xl sticky top-0 z-30 flex items-center px-4 gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen((o) => !o)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <div
              className="hidden sm:flex items-center rounded-full border border-border bg-background/70 px-3 h-8 text-xs text-muted-foreground tabular"
              title="Messages remaining on your plan"
            >
              <span className="pulse-ring w-1.5 h-1.5 rounded-full bg-success mr-2" />
              {remaining} / {user?.messagesQuota ?? 0} messages left
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-border transition-shadow hover:ring-primary/50">
                  <AvatarImage src={user?.avatar || user?.avatarUrl || undefined} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <Link to="/profile-settings"><DropdownMenuItem>Profile Settings</DropdownMenuItem></Link>
                <Link to="/api-settings"><DropdownMenuItem>API Settings</DropdownMenuItem></Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="container py-6 md:py-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
