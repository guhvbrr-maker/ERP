import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { Dashboard } from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Categorias from "./pages/produtos/Categorias";
import Catalogo from "./pages/produtos/Catalogo";
import FormularioProduto from "./pages/produtos/FormularioProduto";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/produtos/categorias" element={<Categorias />} />
          <Route path="/produtos/catalogo" element={<Catalogo />} />
          <Route path="/produtos/catalogo/novo" element={<FormularioProduto />} />
          <Route path="/produtos/catalogo/:id/editar" element={<FormularioProduto />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
