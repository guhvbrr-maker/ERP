import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ImpressaoVendaProps {
  sale: any;
  items: any[];
  payments?: any[];
  delivery?: any;
}

export const ImpressaoVenda = ({ sale, items, payments = [], delivery }: ImpressaoVendaProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="hidden print:block p-8 max-w-4xl mx-auto bg-white text-black">
      <div className="border-b-2 border-gray-800 pb-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">PEDIDO DE VENDA</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold">Número: {sale.sale_number}</p>
            <p>Data: {format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase">{sale.status}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-400">DADOS DO CLIENTE</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-semibold">Nome:</span> {sale.customer_name}</p>
            {sale.customer_document && (
              <p><span className="font-semibold">CPF/CNPJ:</span> {sale.customer_document}</p>
            )}
          </div>
          <div>
            {sale.customer_email && (
              <p><span className="font-semibold">Email:</span> {sale.customer_email}</p>
            )}
            {sale.customer_phone && (
              <p><span className="font-semibold">Telefone:</span> {sale.customer_phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 border-b border-gray-400">PRODUTOS</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-2">Produto</th>
              <th className="text-left py-2">SKU</th>
              <th className="text-right py-2">Qtd</th>
              <th className="text-right py-2">Preço Unit.</th>
              <th className="text-right py-2">Desconto</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, index: number) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2">{item.product_name}</td>
                <td className="py-2">{item.product_sku}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">{formatCurrency(Number(item.unit_price))}</td>
                <td className="text-right py-2">{formatCurrency(Number(item.discount))}</td>
                <td className="text-right py-2 font-semibold">
                  {formatCurrency(Number(item.total))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(Number(sale.subtotal))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Desconto:</span>
              <span className="font-semibold">{formatCurrency(Number(sale.discount))}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-gray-800 text-lg">
              <span className="font-bold">TOTAL:</span>
              <span className="font-bold">{formatCurrency(Number(sale.total))}</span>
            </div>
          </div>
        </div>
      </div>

      {delivery && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-400">ENTREGA</h2>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Endereço:</span> {delivery.address}</p>
            {delivery.city && delivery.state && (
              <p><span className="font-semibold">Cidade/Estado:</span> {delivery.city} - {delivery.state}</p>
            )}
            {delivery.zipcode && (
              <p><span className="font-semibold">CEP:</span> {delivery.zipcode}</p>
            )}
            <p><span className="font-semibold">Data Agendada:</span> {format(new Date(delivery.scheduled_date), "dd/MM/yyyy", { locale: ptBR })}</p>
            <p><span className="font-semibold">Status:</span> {delivery.status}</p>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-400">PAGAMENTOS</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left py-2">Forma</th>
                <th className="text-right py-2">Valor</th>
                <th className="text-right py-2">Vencimento</th>
                <th className="text-right py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any, index: number) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-2 capitalize">{payment.payment_method?.replace("_", " ")}</td>
                  <td className="text-right py-2">{formatCurrency(Number(payment.amount))}</td>
                  <td className="text-right py-2">
                    {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                  </td>
                  <td className="text-right py-2 uppercase">{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sale.notes && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-3 border-b border-gray-400">OBSERVAÇÕES</h2>
          <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-400 text-center text-sm text-gray-600">
        <p>Este documento é válido como comprovante de pedido</p>
        <p className="mt-1">Impresso em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </div>
    </div>
  );
};