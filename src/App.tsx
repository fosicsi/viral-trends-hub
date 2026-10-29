import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import OnboardingGuard from "./components/auth/OnboardingGuard";

// Lazy-loaded routes for code-splitting & performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IntegrationsPage = lazy(() => import("./features/integrations/IntegrationsPage"));
const OAuthCallback = lazy(() => import("./pages/auth/OAuthCallback"));
const AuthPage = lazy(() => import("./pages/Auth"));
const AnalyticsLayout = lazy(() => import("./features/analytics/layout/AnalyticsLayout"));
const AnalyticsDashboard = lazy(() => import("./features/analytics/pages/AnalyticsDashboard"));
const CreatorStudio = lazy(() => import("./features/studio/pages/CreatorStudio"));
const Profile = lazy(() => import("./pages/Profile"));
const OutliersLayout = lazy(() => import("./features/outliers/layout/OutliersLayout").then(m => ({ default: m.OutliersLayout })));
const OutlierSearchPage = lazy(() => import("./features/outliers/pages/OutlierSearchPage"));
const PoliciesPage = lazy(() => import("./features/policies/pages/PoliciesPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const Onboarding = lazy(() => import("./pages/Onboarding"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-8 h-8 text-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public SaaS Landing & Legal / Compliance */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/policies" element={<PoliciesPage />} />

            {/* Public / Auth Roots */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/onboarding" element={
              <OnboardingGuard>
                <Onboarding />
              </OnboardingGuard>
            } />

            {/* Protected Creator Workspace Routes */}
            <Route path="/dashboard" element={
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
            </Route>

            <Route path="/studio" element={
              <OnboardingGuard>
                <CreatorStudio />
              </OnboardingGuard>
            } />

            <Route path="/outliers" element={
              <OnboardingGuard>
                <OutliersLayout />
              </OnboardingGuard>
            }>
              <Route index element={<OutlierSearchPage />} />
            </Route>

            <Route path="/profile" element={
              <OnboardingGuard>
                <Profile />
              </OnboardingGuard>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
