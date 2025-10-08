import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Categorias from "./pages/produtos/Categorias";
import Catalogo from "./pages/produtos/Catalogo";
import FormularioProduto from "./pages/produtos/FormularioProduto";
import Configuracoes from "./pages/Configuracoes";
import Vendas from "./pages/vendas/Vendas";
import NovaVenda from "./pages/vendas/NovaVenda";
import DetalheVenda from "./pages/vendas/DetalheVenda";
import Estoque from "./pages/estoque/Estoque";
import ContasReceber from "./pages/financeiro/ContasReceber";
import Entregas from "./pages/entregas/Entregas";
import MainLayout from "./components/layout/MainLayout";
import Clientes from "./pages/pessoas/Clientes";
import Funcionarios from "./pages/pessoas/Funcionarios";
import Fornecedores from "./pages/pessoas/Fornecedores";
import Cargos from "./pages/pessoas/Cargos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
            <Route path="/pessoas/clientes" element={<ProtectedRoute><MainLayout><Clientes /></MainLayout></ProtectedRoute>} />
            <Route path="/pessoas/funcionarios" element={<ProtectedRoute requiredRole="manager"><MainLayout><Funcionarios /></MainLayout></ProtectedRoute>} />
            <Route path="/pessoas/fornecedores" element={<ProtectedRoute requiredRole="manager"><MainLayout><Fornecedores /></MainLayout></ProtectedRoute>} />
            <Route path="/pessoas/cargos" element={<ProtectedRoute requiredRole="manager"><MainLayout><Cargos /></MainLayout></ProtectedRoute>} />
            <Route path="/produtos/categorias" element={<ProtectedRoute><MainLayout><Categorias /></MainLayout></ProtectedRoute>} />
            <Route path="/produtos/catalogo" element={<ProtectedRoute><MainLayout><Catalogo /></MainLayout></ProtectedRoute>} />
            <Route path="/produtos/catalogo/novo" element={<ProtectedRoute><MainLayout><FormularioProduto /></MainLayout></ProtectedRoute>} />
            <Route path="/produtos/catalogo/:id/editar" element={<ProtectedRoute><MainLayout><FormularioProduto /></MainLayout></ProtectedRoute>} />
            <Route path="/vendas" element={<ProtectedRoute><MainLayout><Vendas /></MainLayout></ProtectedRoute>} />
            <Route path="/vendas/nova" element={<ProtectedRoute><MainLayout><NovaVenda /></MainLayout></ProtectedRoute>} />
            <Route path="/vendas/:id" element={<ProtectedRoute><MainLayout><DetalheVenda /></MainLayout></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><MainLayout><Estoque /></MainLayout></ProtectedRoute>} />
            <Route path="/financeiro/contas-receber" element={<ProtectedRoute requiredRole="accountant"><MainLayout><ContasReceber /></MainLayout></ProtectedRoute>} />
            <Route path="/entregas" element={<ProtectedRoute><MainLayout><Entregas /></MainLayout></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute requiredRole="admin"><MainLayout><Configuracoes /></MainLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
