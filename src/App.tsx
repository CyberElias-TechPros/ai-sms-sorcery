
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

// Initialize QueryClient for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-generator" element={<AIGenerator />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sms-composer" element={<SMSComposer />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/scheduled" element={<Scheduled />} />
          <Route path="/message-logs" element={<MessageLogs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
