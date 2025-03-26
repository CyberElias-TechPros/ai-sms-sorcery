import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, MessageSquare, Users, Calendar, Settings, 
  Activity, LogOut, Menu, X, MessageCircle, BrainCircuit,
  FileText
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, to, active, onClick }: SidebarItemProps) => {
  return (
    <Link 
      to={to} 
      className="w-full" 
      onClick={onClick}
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 pl-3 font-normal",
          "transition-all duration-200 ease-in-out",
          active 
            ? "bg-primary/10 text-primary hover:bg-primary/15" 
            : "hover:bg-secondary text-muted-foreground"
        )}
      >
        <Icon size={18} className={cn(active ? "text-primary" : "text-muted-foreground")} />
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
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobileView]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

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

  if (location.pathname === "/auth") {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen flex relative">
      {isSidebarOpen && isMobileView && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={toggleSidebar}
        />
      )}
      
      <aside
        className={cn(
          "fixed md:relative z-50 h-full flex flex-col bg-card border-r",
          "transition-all duration-300 ease-in-out",
          "w-64",
          isSidebarOpen ? "left-0" : "-left-full md:-left-64",
          "md:left-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center mr-2">
              <MessageSquare size={18} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">SMS Messenger</h1>
          </div>
          {isMobileView && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              className="md:hidden"
            >
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
                onClick={closeSidebar}
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
      
      <main className={cn(
        "flex-1 min-h-screen flex flex-col bg-background transition-all duration-300",
        isSidebarOpen && !isMobileView ? "md:ml-64" : ""
      )}>
        <header className="h-16 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30 flex items-center px-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleSidebar}
          >
            <Menu size={20} />
          </Button>
          
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full h-8 border border-border bg-background">
              <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse-slow"></span>
              Connected
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
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
                <Link to="/profile-settings">
                  <DropdownMenuItem>
                    Profile Settings
                  </DropdownMenuItem>
                </Link>
                <Link to="/api-settings">
                  <DropdownMenuItem>
                    API Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto">
          <div className="container py-6 animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
