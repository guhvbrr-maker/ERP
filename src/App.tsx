import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Categorias from "./pages/produtos/Categorias";
import Catalogo from "./pages/produtos/Catalogo";
import FormularioProduto from "./pages/produtos/FormularioProduto";
import Configuracoes from "./pages/Configuracoes";
import MainLayout from "./components/layout/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/produtos/categorias" element={<MainLayout><Categorias /></MainLayout>} />
          <Route path="/produtos/catalogo" element={<MainLayout><Catalogo /></MainLayout>} />
          <Route path="/produtos/catalogo/novo" element={<MainLayout><FormularioProduto /></MainLayout>} />
          <Route path="/produtos/catalogo/:id/editar" element={<MainLayout><FormularioProduto /></MainLayout>} />
          <Route path="/configuracoes" element={<MainLayout><Configuracoes /></MainLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
