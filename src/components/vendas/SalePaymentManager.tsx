import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Calculator } from "lucide-react";
import { toast } from "sonner";

export interface PaymentPlan {
  payment_method_id: string;
  payment_method_name: string;
  card_brand_id?: string;
  installments: number;
  amount: number;
  due_date: string;
  installment_details?: Array<{
    installment: number;
    amount: number;
    due_date: string;
    fee_percentage: number;
    fee_amount: number;
    net_amount: number;
  }>;
}

interface SalePaymentManagerProps {
  totalAmount: number;
  payments: PaymentPlan[];
  onChange: (payments: PaymentPlan[]) => void;
}

type PaymentMethodType = "cash" | "credit_card" | "debit_card" | "pix" | "bank_slip" | string;

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  has_installments: boolean;
  has_fees: boolean;
}

interface CardBrand {
  id: string;
  name: string;
}

interface CardFee {
  id: string;
  installments: number;
  fee_percentage: number;
  fixed_fee?: number | null;
}

export const SalePaymentManager = ({ totalAmount, payments, onChange }: SalePaymentManagerProps) => {
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [installments, setInstallments] = useState(1);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["payment_methods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: cardBrands = [] } = useQuery<CardBrand[]>({
    queryKey: ["card_brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("card_brands")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: cardFees = [] } = useQuery<CardFee[]>({
    queryKey: ["card_fees", selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      const { data, error } = await supabase
        .from("card_fees")
        .select("*")
        .eq("card_brand_id", selectedBrand)
        .eq("active", true)
        .order("installments");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBrand,
  });

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod);
  const needsCardBrand = selectedPaymentMethod?.type === "credit_card" || selectedPaymentMethod?.type === "debit_card";
  const canHaveInstallments = selectedPaymentMethod?.has_installments;

  const calculateInstallments = () => {
    if (!selectedMethod) {
      toast.error("Selecione uma forma de pagamento");
      return;
    }

    if (needsCardBrand && !selectedBrand) {
      toast.error("Selecione a bandeira do cartão");
      return;
    }

    if (!amount || !dueDate) {
      toast.error("Preencha o valor e a data de vencimento");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      toast.error("Valor deve ser maior que zero");
      return;
    }

    const remainingAmount = totalAmount - payments.reduce((sum, p) => sum + p.amount, 0);
    if (paymentAmount - remainingAmount > 0.01) {
      toast.error("Valor informado ultrapassa o total restante da venda");
      return;
    }

    const method = paymentMethods.find((m) => m.id === selectedMethod);
    if (!method) return;

    const sanitizedInstallments = canHaveInstallments ? Math.max(1, Math.min(24, Math.floor(installments))) : 1;
    const baseDate = new Date(dueDate);
    if (Number.isNaN(baseDate.getTime())) {
      toast.error("Data de vencimento inválida");
      return;
    }

    const installmentDetails = [];

    for (let i = 1; i <= sanitizedInstallments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + (i - 1));

      let feePercentage = 0;
      let feeAmount = 0;
      const installmentValue = paymentAmount / sanitizedInstallments;
      let netAmount = installmentValue;

      // Se tem taxa de cartão, aplicar
      if (needsCardBrand && selectedBrand && method.has_fees) {
        const fee = cardFees.find((f) => f.installments === i);
        if (fee) {
          feePercentage = Number(fee.fee_percentage);
          feeAmount = (installmentValue * feePercentage) / 100 + Number(fee.fixed_fee || 0);
          netAmount = installmentValue - feeAmount;
        }
      }

      installmentDetails.push({
        installment: i,
        amount: installmentValue,
        due_date: installmentDate.toISOString().split("T")[0],
        fee_percentage: feePercentage,
        fee_amount: feeAmount,
        net_amount: netAmount,
      });
    }

    const newPayment: PaymentPlan = {
      payment_method_id: selectedMethod,
      payment_method_name: method.name,
      card_brand_id: needsCardBrand ? selectedBrand : undefined,
      installments: sanitizedInstallments,
      amount: paymentAmount,
      due_date: dueDate,
      installment_details: installmentDetails,
    };

    const updatedPayments = [...payments, newPayment].sort((a, b) => a.due_date.localeCompare(b.due_date));
    onChange(updatedPayments);

    // Reset form
    setSelectedMethod("");
    setSelectedBrand("");
    setInstallments(1);
    setAmount("");
    setDueDate("");
  };

  const removePayment = (index: number) => {
    onChange(payments.filter((_, i) => i !== index));
  };

  const totalPayments = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remainingAmount = useMemo(() => totalAmount - totalPayments, [totalAmount, totalPayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamentos</CardTitle>
        <div className="flex justify-between text-sm mt-2">
          <span>Total da Venda:</span>
          <span className="font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalAmount)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Total Lançado:</span>
          <span className="font-medium">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalPayments)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Restante:</span>
          <span className={`font-bold ${remainingAmount < 0 ? "text-red-500" : remainingAmount > 0 ? "text-yellow-500" : "text-green-500"}`}>
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(remainingAmount)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form para adicionar pagamento */}
        <div className="grid grid-cols-5 gap-3">
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Forma de Pagamento" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {needsCardBrand && (
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="Bandeira" />
              </SelectTrigger>
              <SelectContent>
                {cardBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {canHaveInstallments && (
            <Input
              type="number"
              min="1"
              max="24"
              placeholder="Parcelas"
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
            />
          )}

          <Input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            type="date"
            placeholder="Vencimento"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Button type="button" onClick={calculateInstallments} disabled={!selectedMethod}>
            <Calculator className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Lista de pagamentos adicionados */}
        {payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{payment.payment_method_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {payment.installments}x de{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(payment.amount / payment.installments)}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePayment(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {payment.installment_details && payment.installment_details.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Taxa</TableHead>
                        <TableHead>Líquido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payment.installment_details.map((detail) => (
                        <TableRow key={detail.installment}>
                          <TableCell>{detail.installment}/{payment.installments}</TableCell>
                          <TableCell>
                            {new Date(detail.due_date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(detail.amount)}
                          </TableCell>
                          <TableCell>
                            {detail.fee_percentage > 0 ? (
                              <span className="text-red-500">
                                -{new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(detail.fee_amount)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(detail.net_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
