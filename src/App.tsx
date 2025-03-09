
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AIGenerator from "./pages/AIGenerator";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SMSComposer from "./pages/SMSComposer";
import Contacts from "./pages/Contacts";
import Scheduled from "./pages/Scheduled";
import MessageLogs from "./pages/MessageLogs";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import MessageTemplates from "./pages/MessageTemplates";

// Initialize QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple auth protection - in a real app, this would be more robust
const AuthRoute = ({ element }: { element: React.ReactNode }) => {
  // For demo purposes, always consider user logged in
  // In production, this would check for valid auth tokens
  const isAuthenticated = true; // localStorage.getItem('auth_token') !== null;
  
  return isAuthenticated ? element : <Navigate to="/auth" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<AuthRoute element={<Dashboard />} />} />
          <Route path="/ai-generator" element={<AuthRoute element={<AIGenerator />} />} />
          <Route path="/sms-composer" element={<AuthRoute element={<SMSComposer />} />} />
          <Route path="/contacts" element={<AuthRoute element={<Contacts />} />} />
          <Route path="/scheduled" element={<AuthRoute element={<Scheduled />} />} />
          <Route path="/message-logs" element={<AuthRoute element={<MessageLogs />} />} />
          <Route path="/analytics" element={<AuthRoute element={<Analytics />} />} />
          <Route path="/settings" element={<AuthRoute element={<Settings />} />} />
          <Route path="/message-templates" element={<AuthRoute element={<MessageTemplates />} />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
