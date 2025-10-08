import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Customer {
  id: string;
  person_id: string;
  people: {
    name: string;
    document: string;
    email: string;
    phone: string;
    address: string;
    address_number: string;
    address_complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
}

interface CustomerSelectorProps {
  onSelect: (customer: Customer) => void;
}

export const CustomerSelector = ({ onSelect }: CustomerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers", "selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select(`
          id,
          person_id,
          people!inner(
            name,
            document,
            email,
            phone,
            address,
            address_number,
            address_complement,
            neighborhood,
            city,
            state,
            zipcode
          )
        `)
        .order("people(name)");

      if (error) throw error;
      return data as Customer[];
    },
  });

  const filteredCustomers = customers.filter((c) =>
    c.people.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.people.document && c.people.document.toLowerCase().includes(search.toLowerCase())) ||
    (c.people.phone && c.people.phone.includes(search))
  );

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setOpen(false);
    setSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Buscar Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Selecionar Cliente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex-1 overflow-auto border rounded-md">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                Carregando...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.people.name}
                      </TableCell>
                      <TableCell>{customer.people.document || "-"}</TableCell>
                      <TableCell>{customer.people.phone || "-"}</TableCell>
                      <TableCell>
                        {customer.people.city && customer.people.state
                          ? `${customer.people.city}/${customer.people.state}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleSelect(customer)}
                        >
                          Selecionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
