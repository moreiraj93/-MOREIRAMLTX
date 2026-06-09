import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SuccessPage from "./pages/SuccessPage";
import AccountPage from "./pages/AccountPage";
import LandingPage from "./pages/LandingPage";
import TreasuryPage from "./pages/TreasuryPage";
import AICopilotPage from "./pages/seo/AICopilotPage";
import AIVoiceAssistantPage from "./pages/seo/AIVoiceAssistantPage";
import AIImageGeneratorPage from "./pages/seo/AIImageGeneratorPage";
import AICodingAssistantPage from "./pages/seo/AICodingAssistantPage";
import AIWebsiteBuilderPage from "./pages/seo/AIWebsiteBuilderPage";
import AIAgentPlatformPage from "./pages/seo/AIAgentPlatformPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/treasury" element={<TreasuryPage />} />
            <Route path="/ai-copilot" element={<AICopilotPage />} />
            <Route path="/ai-voice-assistant" element={<AIVoiceAssistantPage />} />
            <Route path="/ai-image-generator" element={<AIImageGeneratorPage />} />
            <Route path="/ai-coding-assistant" element={<AICodingAssistantPage />} />
            <Route path="/ai-website-builder" element={<AIWebsiteBuilderPage />} />
            <Route path="/ai-agent-platform" element={<AIAgentPlatformPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
