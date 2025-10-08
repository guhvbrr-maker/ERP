import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { CepAddressForm } from "@/components/common/CepAddressForm";

interface FormularioPessoaProps {
  type: "customer" | "employee" | "supplier";
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const contactSources = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "fachada", label: "Fachada" },
  { value: "radio", label: "Rádio" },
  { value: "outdoor", label: "Outdoor" },
  { value: "google", label: "Google" },
  { value: "youtube", label: "YouTube" },
  { value: "indicacao", label: "Indicação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "website", label: "Website" },
  { value: "outros", label: "Outros" },
];

export function FormularioPessoa({ type, initialData, onSuccess, onCancel }: FormularioPessoaProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPositions, setSelectedPositions] = useState<any[]>([]);
  
  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: type === "employee",
  });

  useEffect(() => {
    if (type !== "employee") {
      setSelectedPositions([]);
      return;
    }

    const employeeRecord = initialData?.employees?.[0];
    const positions = employeeRecord?.employee_positions || initialData?.positions;

    if (positions && positions.length > 0) {
      setSelectedPositions(
        positions.map((ep: any) => ({
          position_id: ep.position_id,
          is_primary: ep.is_primary,
          started_at: ep.started_at,
        }))
      );
    } else {
      setSelectedPositions([]);
    }
  }, [type, initialData]);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      document: initialData?.document || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      phone_secondary: initialData?.phone_secondary || "",
      zipcode: initialData?.zipcode || "",
      address: initialData?.address || "",
      address_number: initialData?.address_number || "",
      address_complement: initialData?.address_complement || "",
      neighborhood: initialData?.neighborhood || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      contact_source: initialData?.contact_source || "",
      notes: initialData?.notes || "",
      active: initialData?.active ?? true,
      // Customer specific
      birth_date: initialData?.customers?.[0]?.birth_date || "",
      preferred_contact: initialData?.customers?.[0]?.preferred_contact || "",
      credit_limit: initialData?.customers?.[0]?.credit_limit || "",
      // Employee specific
      hire_date: initialData?.employees?.[0]?.hire_date || "",
      position: initialData?.employees?.[0]?.position || "",
      department: initialData?.employees?.[0]?.department || "",
      salary: initialData?.employees?.[0]?.salary || "",
      commission_rate: initialData?.employees?.[0]?.commission_rate || "",
      login_email: initialData?.email || "",
      login_password: "",
      // Supplier specific
      company_name: initialData?.suppliers?.[0]?.company_name || "",
      trade_name: initialData?.suppliers?.[0]?.trade_name || "",
      payment_terms: initialData?.suppliers?.[0]?.payment_terms || "",
      delivery_time_days: initialData?.suppliers?.[0]?.delivery_time_days || "",
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);

    try {
      const personData = {
        type,
        name: data.name,
        document: data.document,
        email: data.email,
        phone: data.phone,
        phone_secondary: data.phone_secondary,
        zipcode: data.zipcode,
        address: data.address,
        address_number: data.address_number,
        address_complement: data.address_complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        contact_source: data.contact_source || null,
        notes: data.notes,
        active: data.active,
      };

      let personId = initialData?.id;

      if (initialData) {
        // Update existing person
        const { error: personError } = await supabase
          .from("people")
          .update(personData)
          .eq("id", initialData.id);

        if (personError) throw personError;
      } else {
        // Create new person
        const { data: newPerson, error: personError } = await supabase
          .from("people")
          .insert([personData])
          .select()
          .single();

        if (personError) throw personError;
        personId = newPerson.id;
      }

      // Handle type-specific data
      if (type === "customer") {
        const customerData = {
          person_id: personId,
          birth_date: data.birth_date || null,
          preferred_contact: data.preferred_contact,
          credit_limit: data.credit_limit || null,
        };

        if (initialData?.customers?.[0]) {
          await supabase
            .from("customers")
            .update(customerData)
            .eq("id", initialData.customers[0].id);
        } else {
          await supabase.from("customers").insert([customerData]);
        }
      } else if (type === "employee") {
        let userId = initialData?.employees?.[0]?.user_id;

        // Create user account if email and password provided
        if (data.login_email && data.login_password && !userId) {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: data.login_email,
            password: data.login_password,
            email_confirm: true,
          });

          if (authError) {
            // If admin API fails, try regular signup
            const { data: signupData, error: signupError } = await supabase.auth.signUp({
              email: data.login_email,
              password: data.login_password,
            });
            
            if (signupError) throw new Error("Erro ao criar login: " + signupError.message);
            userId = signupData.user?.id;
          } else {
            userId = authData.user?.id;
          }
        }

        const employeeData = {
          person_id: personId,
          hire_date: data.hire_date || null,
          position: data.position,
          department: data.department,
          salary: data.salary || null,
          commission_rate: data.commission_rate || null,
          user_id: userId,
        };

        let employeeId = initialData?.employees?.[0]?.id;

        if (initialData?.employees?.[0]) {
          await supabase
            .from("employees")
            .update(employeeData)
            .eq("id", initialData.employees[0].id);
        } else {
          const { data: newEmployee, error: empError } = await supabase
            .from("employees")
            .insert([employeeData])
            .select()
            .single();
          if (empError) throw empError;
          employeeId = newEmployee.id;
        }

        // Save employee positions
        if (employeeId) {
          await supabase
            .from("employee_positions")
            .delete()
            .eq("employee_id", employeeId);

          if (selectedPositions.length > 0) {
            const positionsToInsert = selectedPositions
              .filter((sp) => sp.position_id)
              .map((sp) => ({
                employee_id: employeeId,
                position_id: sp.position_id,
                is_primary: sp.is_primary,
                started_at:
                  sp.started_at || new Date().toISOString().split("T")[0],
              }));

            if (positionsToInsert.length > 0) {
              await supabase
                .from("employee_positions")
                .insert(positionsToInsert);
            }
          }
        }
      } else if (type === "supplier") {
        const supplierData = {
          person_id: personId,
          company_name: data.company_name,
          trade_name: data.trade_name,
          payment_terms: data.payment_terms,
          delivery_time_days: data.delivery_time_days || null,
        };

        if (initialData?.suppliers?.[0]) {
          await supabase
            .from("suppliers")
            .update(supplierData)
            .eq("id", initialData.suppliers[0].id);
        } else {
          await supabase.from("suppliers").insert([supplierData]);
        }
      }

      toast.success(initialData ? "Atualizado com sucesso!" : "Cadastrado com sucesso!");
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="dados-basicos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="especificos">
            {type === "customer" ? "Cliente" : type === "employee" ? "Funcionário" : "Fornecedor"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dados-basicos" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register("name")} required />
            </div>

            <div>
              <Label htmlFor="document">{type === "supplier" ? "CNPJ" : "CPF/CNPJ"}</Label>
              <Input id="document" {...register("document")} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...register("phone")} />
            </div>

            <div>
              <Label htmlFor="phone_secondary">Telefone 2</Label>
              <Input id="phone_secondary" {...register("phone_secondary")} />
            </div>

            {type === "customer" && (
              <div className="col-span-2">
                <Label htmlFor="contact_source">Origem do Contato</Label>
                <Select
                  value={watch("contact_source")}
                  onValueChange={(value) => setValue("contact_source", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contactSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea id="notes" {...register("notes")} rows={3} />
            </div>

            <div className="flex items-center gap-2 col-span-2">
              <Switch
                id="active"
                checked={watch("active")}
                onCheckedChange={(checked) => setValue("active", checked)}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="endereco" className="space-y-4 mt-4">
          <CepAddressForm
            cep={watch("zipcode")}
            logradouro={watch("address")}
            numero={watch("address_number")}
            complemento={watch("address_complement")}
            bairro={watch("neighborhood")}
            cidade={watch("city")}
            uf={watch("state")}
            onCepChange={(value) => setValue("zipcode", value)}
            onLogradouroChange={(value) => setValue("address", value)}
            onNumeroChange={(value) => setValue("address_number", value)}
            onComplementoChange={(value) => setValue("address_complement", value)}
            onBairroChange={(value) => setValue("neighborhood", value)}
            onCidadeChange={(value) => setValue("city", value)}
            onUfChange={(value) => setValue("state", value)}
          />
        </TabsContent>

        <TabsContent value="especificos" className="space-y-4 mt-4">
          {type === "customer" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input id="birth_date" type="date" {...register("birth_date")} />
              </div>

              <div>
                <Label htmlFor="preferred_contact">Contato Preferencial</Label>
                <Input id="preferred_contact" {...register("preferred_contact")} />
              </div>

              <div>
                <Label htmlFor="credit_limit">Limite de Crédito</Label>
                <Input id="credit_limit" type="number" step="0.01" {...register("credit_limit")} />
              </div>
            </div>
          )}

          {type === "employee" && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h3 className="font-medium text-sm">Acesso ao Sistema</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="login_email">Email para Login</Label>
                    <Input 
                      id="login_email" 
                      type="email" 
                      {...register("login_email")}
                      placeholder="email@exemplo.com"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {initialData?.employees?.[0]?.user_id 
                        ? "Usuário já possui acesso ao sistema" 
                        : "Criar login para acesso ao sistema"}
                    </p>
                  </div>

                  {!initialData?.employees?.[0]?.user_id && (
                    <div>
                      <Label htmlFor="login_password">Senha</Label>
                      <Input 
                        id="login_password" 
                        type="password" 
                        {...register("login_password")}
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hire_date">Data de Admissão</Label>
                  <Input id="hire_date" type="date" {...register("hire_date")} />
                </div>

                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" {...register("department")} />
                </div>

                <div>
                  <Label htmlFor="salary">Salário</Label>
                  <Input id="salary" type="number" step="0.01" {...register("salary")} />
                </div>

                <div>
                  <Label htmlFor="commission_rate">Taxa Comissão Base (%)</Label>
                  <Input id="commission_rate" type="number" step="0.01" {...register("commission_rate")} />
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Cargos do Funcionário</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPositions([
                        ...selectedPositions,
                        {
                          position_id: "",
                          is_primary: selectedPositions.length === 0,
                          started_at: new Date().toISOString().split("T")[0],
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Cargo
                  </Button>
                </div>

                {selectedPositions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum cargo selecionado. Clique em "Adicionar Cargo" para começar.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPositions.map((sp, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 border rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Select
                            value={sp.position_id}
                            onValueChange={(value) => {
                              const updated = [...selectedPositions];
                              updated[index].position_id = value;
                              setSelectedPositions(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              {positions?.map((pos: any) => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            type="date"
                            value={sp.started_at}
                            onChange={(e) => {
                              const updated = [...selectedPositions];
                              updated[index].started_at = e.target.value;
                              setSelectedPositions(updated);
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={sp.is_primary}
                            onCheckedChange={(checked) => {
                              const updated = selectedPositions.map((p, i) => ({
                                ...p,
                                is_primary: i === index ? !!checked : false,
                              }));
                              setSelectedPositions(updated);
                            }}
                          />
                          <Label className="text-sm">Principal</Label>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPositions(
                              selectedPositions.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {type === "supplier" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Razão Social</Label>
                <Input id="company_name" {...register("company_name")} />
              </div>

              <div>
                <Label htmlFor="trade_name">Nome Fantasia</Label>
                <Input id="trade_name" {...register("trade_name")} />
              </div>

              <div>
                <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                <Input id="payment_terms" {...register("payment_terms")} />
              </div>

              <div>
                <Label htmlFor="delivery_time_days">Prazo de Entrega (dias)</Label>
                <Input id="delivery_time_days" type="number" {...register("delivery_time_days")} />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
