import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import IntegrationsPage from "./features/integrations/IntegrationsPage";
import OAuthCallback from "./pages/auth/OAuthCallback";
import AuthPage from "./pages/Auth";
import AnalyticsLayout from "./features/analytics/layout/AnalyticsLayout";
import AnalyticsDashboard from "./features/analytics/pages/AnalyticsDashboard";
import AnalyticsSettings from "./features/analytics/pages/AnalyticsSettings";
import CreatorStudio from "./features/studio/pages/CreatorStudio";
import Profile from "./pages/Profile";

import Onboarding from "./pages/Onboarding";
import OnboardingGuard from "./components/auth/OnboardingGuard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public / Auth Roots */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/onboarding" element={
            <OnboardingGuard>
              <Onboarding />
            </OnboardingGuard>
          } />

          {/* Protected Main Routes */}
          <Route path="/" element={
            <OnboardingGuard>
              <Index />
            </OnboardingGuard>
          } />
          <Route path="/integrations" element={
            <OnboardingGuard>
              <IntegrationsPage />
            </OnboardingGuard>
          } />
          <Route path="/analytics" element={
            <OnboardingGuard>
              <AnalyticsLayout />
            </OnboardingGuard>
          }>
            <Route index element={<AnalyticsDashboard />} />
            <Route path="settings" element={<AnalyticsSettings />} />
          </Route>

          <Route path="/studio" element={
            <OnboardingGuard>
              <CreatorStudio />
            </OnboardingGuard>
          } />

          <Route path="/profile" element={
            <OnboardingGuard>
              <Profile />
            </OnboardingGuard>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
