import { useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Package, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  type: string;
  ncm: string;
  cost_price: number | null;
  selling_price: number | null;
  active: boolean;
  categories?: {
    name: string;
    color: string | null;
  } | null;
}

export default function Catalogo() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", searchTerm, selectedCategory, selectedType],
    queryFn: async () => {
      let query = supabase.from("products").select(`
        *,
        categories (
          name,
          color
        )
      `);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }

      if (selectedType) {
        query = query.eq("type", selectedType);
      }

      query = query.order("name", { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produto excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir produto: " + error.message);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Deseja realmente excluir este produto?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      simple: "Simples",
      parent: "Pai (com variações)",
      variant: "Variação",
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      simple: "bg-blue-100 text-blue-800",
      parent: "bg-purple-100 text-purple-800",
      variant: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Catálogo de Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie todos os produtos da loja</p>
        </div>
        <Link to="/produtos/catalogo/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="simple">Simples</option>
            <option value="parent">Pai (com variações)</option>
            <option value="variant">Variação</option>
          </select>
          <Button variant="outline" className="w-full">
            <Filter className="mr-2 h-4 w-4" /> Mais Filtros
          </Button>
        </div>
      </Card>

      {/* Lista de Produtos */}
      {isLoading ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">Carregando produtos...</div>
        </Card>
      ) : products.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum produto encontrado</p>
            <Link to="/produtos/catalogo/novo">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Produto
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-sidebar-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-8 w-8 text-sidebar-foreground/50" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">{product.name}</h3>
                        {!product.active && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="font-mono bg-sidebar-accent px-2 py-1 rounded">
                          SKU: {product.sku}
                        </span>
                        <span className="font-mono bg-sidebar-accent px-2 py-1 rounded">
                          NCM: {product.ncm}
                        </span>
                        {product.categories && (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: product.categories.color || undefined,
                              color: product.categories.color || undefined,
                            }}
                          >
                            {product.categories.name}
                          </Badge>
                        )}
                        <Badge className={getTypeColor(product.type)}>
                          {getTypeLabel(product.type)}
                        </Badge>
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-muted-foreground">Preço de Venda</div>
                      <div className="text-xl font-bold text-primary">
                        {formatCurrency(product.selling_price)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Custo: {formatCurrency(product.cost_price)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Link to={`/produtos/catalogo/${product.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </Link>
                  <Link to={`/produtos/catalogo/${product.id}/editar`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {products.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Mostrando {products.length} produto(s)
        </div>
      )}
    </div>
  );
}
