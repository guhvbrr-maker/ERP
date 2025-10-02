import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  Wrench,
  DollarSign,
  BarChart3,
  Settings,
  Store,
  Warehouse,
  ClipboardList,
  CreditCard,
  Calendar,
  FileText,
  Home,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  {
    icon: Users,
    label: "Pessoas",
    path: "/pessoas",
    submenu: [
      { label: "Clientes", path: "/pessoas/clientes" },
      { label: "Funcionários", path: "/pessoas/funcionarios" },
      { label: "Fornecedores", path: "/pessoas/fornecedores" },
    ],
  },
  {
    icon: Package,
    label: "Produtos",
    path: "/produtos",
    submenu: [
      { label: "Catálogo", path: "/produtos/catalogo" },
      { label: "Categorias", path: "/produtos/categorias" },
    ],
  },
  {
    icon: ShoppingCart,
    label: "Vendas",
    path: "/vendas",
    submenu: [
      { label: "Pedidos", path: "/vendas/pedidos" },
      { label: "Orçamentos", path: "/vendas/orcamentos" },
      { label: "PDV", path: "/vendas/pdv" },
    ],
  },
  {
    icon: ClipboardList,
    label: "Compras",
    path: "/compras",
    submenu: [
      { label: "Pedidos", path: "/compras/pedidos" },
      { label: "Sugestões", path: "/compras/sugestoes" },
      { label: "Recebimento", path: "/compras/recebimento" },
    ],
  },
  {
    icon: Warehouse,
    label: "Estoque",
    path: "/estoque",
    submenu: [
      { label: "Posição", path: "/estoque/posicao" },
      { label: "Transferências", path: "/estoque/transferencias" },
      { label: "Inventário", path: "/estoque/inventario" },
      { label: "Reservas", path: "/estoque/reservas" },
    ],
  },
  {
    icon: Truck,
    label: "Entregas",
    path: "/entregas",
    submenu: [
      { label: "Agenda", path: "/entregas/agenda" },
      { label: "Rotas", path: "/entregas/rotas" },
      { label: "Montagens", path: "/entregas/montagens" },
    ],
  },
  {
    icon: Wrench,
    label: "Assistências",
    path: "/assistencias",
    submenu: [
      { label: "Cliente", path: "/assistencias/cliente" },
      { label: "Loja/Showroom", path: "/assistencias/loja" },
      { label: "Depósito", path: "/assistencias/deposito" },
    ],
  },
  {
    icon: DollarSign,
    label: "Financeiro",
    path: "/financeiro",
    submenu: [
      { label: "Contas a Receber", path: "/financeiro/receber" },
      { label: "Contas a Pagar", path: "/financeiro/pagar" },
      { label: "Fluxo de Caixa", path: "/financeiro/fluxo" },
      { label: "DRE", path: "/financeiro/dre" },
      { label: "Comissões", path: "/financeiro/comissoes" },
    ],
  },
  {
    icon: CreditCard,
    label: "Pagamentos",
    path: "/pagamentos",
    submenu: [
      { label: "Bandeiras", path: "/pagamentos/bandeiras" },
      { label: "Taxas", path: "/pagamentos/taxas" },
      { label: "Simulador", path: "/pagamentos/simulador" },
    ],
  },
  {
    icon: BarChart3,
    label: "Relatórios",
    path: "/relatorios",
    submenu: [
      { label: "Vendas", path: "/relatorios/vendas" },
      { label: "Estoque", path: "/relatorios/estoque" },
      { label: "Financeiro", path: "/relatorios/financeiro" },
      { label: "Comissões", path: "/relatorios/comissoes" },
    ],
  },
  {
    icon: Settings,
    label: "Configurações",
    path: "/configuracoes",
    submenu: [
      { label: "Empresa", path: "/configuracoes/empresa" },
      { label: "Usuários", path: "/configuracoes/usuarios" },
      { label: "Depósitos", path: "/configuracoes/depositos" },
      { label: "Integrações", path: "/configuracoes/integracoes" },
    ],
  },
];

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  // Auto-expand o item ativo ao carregar
  React.useEffect(() => {
    const activeItem = menuItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    );
    if (activeItem && !expandedItems.includes(activeItem.path)) {
      setExpandedItems(prev => [...prev, activeItem.path]);
    }
  }, [location.pathname]);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 transform bg-sidebar transition-transform duration-base",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <Home className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-sidebar-foreground">Móveis Karina</span>
              <span className="text-xs text-sidebar-foreground/70">ERP System</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              const isExpanded = expandedItems.includes(item.path);
              const hasSubmenu = item.submenu && item.submenu.length > 0;

              return (
                <div key={item.path}>
                  {hasSubmenu ? (
                    <button
                      onClick={() => toggleExpanded(item.path)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        className={cn(
                          "h-4 w-4 transition-transform duration-fast",
                          isExpanded ? "rotate-180" : ""
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-fast",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-soft"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  )}

                  {item.submenu && isExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.path}
                          to={subitem.path}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-sm transition-colors duration-fast",
                            location.pathname === subitem.path
                              ? "text-sidebar-primary font-medium"
                              : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                          )}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className="rounded-lg bg-sidebar-accent/30 p-3">
              <p className="text-xs font-medium text-sidebar-foreground">Sistema Completo</p>
              <p className="mt-1 text-xs text-sidebar-foreground/70">
                Gestão integrada para sua loja
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
};
