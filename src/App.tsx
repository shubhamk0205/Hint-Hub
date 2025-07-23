import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CodeSpace from "./pages/CodeSpace";
import HintsLibrary from "./pages/HintsLibrary";
import SnippetsRepository from "./pages/SnippetsRepository";
import Collaboration from "./pages/Collaboration";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="dark min-h-screen bg-background text-foreground">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/code-space" element={<Layout><CodeSpace /></Layout>} />
            <Route path="/hints" element={<Layout><HintsLibrary /></Layout>} />
            <Route path="/snippets" element={<Layout><SnippetsRepository /></Layout>} />
            <Route path="/collaborate" element={<Layout><Collaboration /></Layout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Layout><NotFound /></Layout>} />
          </Routes>
        </BrowserRouter>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
