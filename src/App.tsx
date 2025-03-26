
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/providers/AuthProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import ProfileSettings from "./pages/ProfileSettings";
import ApiSettings from "./pages/ApiSettings";

// Initialize QueryClient with production settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/ai-generator" element={<ProtectedRoute><AIGenerator /></ProtectedRoute>} />
              <Route path="/sms-composer" element={<ProtectedRoute><SMSComposer /></ProtectedRoute>} />
              <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/scheduled" element={<ProtectedRoute><Scheduled /></ProtectedRoute>} />
              <Route path="/message-logs" element={<ProtectedRoute><MessageLogs /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile-settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
              <Route path="/api-settings" element={<ProtectedRoute><ApiSettings /></ProtectedRoute>} />
              <Route path="/message-templates" element={<ProtectedRoute><MessageTemplates /></ProtectedRoute>} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
