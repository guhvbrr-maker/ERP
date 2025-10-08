# Melhorias no Gerenciamento de Vendas

## Visão Geral

O sistema de vendas foi significativamente aprimorado com recursos avançados de gerenciamento de estoque, rastreamento de vendedores e alertas automáticos.

## Recursos Implementados

### 1. Atribuição de Vendedor
- **Campo Vendedor**: Agora é possível atribuir um vendedor/funcionário a cada venda
- **Seletor de Funcionários**: Interface intuitiva para selecionar o vendedor responsável pela venda
- **Visualização**: O nome do vendedor é exibido nos detalhes da venda

**Como usar:**
1. Ao criar uma nova venda, selecione o vendedor no campo "Vendedor"
2. O campo é opcional - se não selecionado, a venda será criada sem vendedor atribuído
3. Nos detalhes da venda, o nome do vendedor será exibido junto aos dados do cliente

### 2. Gerenciamento Automático de Estoque

#### Dedução Automática de Estoque
Quando o status de uma venda é alterado para **"Confirmada"** ou **"Concluída"**, o sistema automaticamente:
- Deduz a quantidade vendida do estoque disponível
- Atualiza o registro de estoque no depósito padrão
- Registra a data/hora da atualização

#### Restauração de Estoque
Se uma venda confirmada ou concluída for **cancelada**, o sistema automaticamente:
- Restaura a quantidade ao estoque
- Reverte a dedução anterior

#### Avisos e Validações
- ⚠️ **Estoque Zerado**: Alerta visual destacado quando um produto não tem estoque
- ⚠️ **Estoque Baixo**: Aviso quando há menos de 5 unidades disponíveis
- ⚠️ **Estoque Insuficiente**: Notificação quando a quantidade solicitada é maior que o disponível

**Importante:** A venda pode ser criada mesmo com estoque zerado, mas você será alertado. O estoque só será deduzido quando a venda for confirmada ou concluída.

### 3. Verificação de Estoque em Tempo Real

#### Durante a Criação de Venda
- Cada produto adicionado tem seu estoque verificado automaticamente
- Avisos visuais são exibidos imediatamente se houver problemas
- Coluna de "Estoque" mostra a quantidade disponível com código de cores:
  - 🟢 Verde: Estoque adequado (≥5 unidades)
  - 🟡 Amarelo: Estoque baixo (<5 unidades)
  - 🔴 Vermelho: Estoque zerado (0 unidades)

#### Alertas Globais
Um alerta destacado aparece no topo da lista de produtos quando há:
- Produtos com estoque zerado
- Produtos com estoque insuficiente para a quantidade solicitada
- Produtos sem estoque cadastrado

### 4. Contas a Receber Automáticas (Já Existente)
O sistema já cria automaticamente contas a receber quando:
- Pagamentos são registrados na venda
- Suporta parcelamento com taxas
- Vincula as contas à venda para fácil rastreamento

## Fluxo de Trabalho Recomendado

### Para Criar uma Venda
1. **Selecione o Cliente**: Use o seletor de clientes ou digite manualmente
2. **Escolha o Vendedor**: Selecione o funcionário responsável
3. **Adicione Produtos**: 
   - Busque e adicione produtos
   - Observe os alertas de estoque em tempo real
   - Ajuste quantidades conforme necessário
4. **Configure Pagamentos**: Defina formas de pagamento e parcelamento
5. **Revise Alertas**: Verifique qualquer aviso de estoque antes de salvar
6. **Salve a Venda**: A venda será criada com status "Pendente"

### Para Confirmar uma Venda
1. **Abra os Detalhes da Venda**
2. **Altere o Status**: Mude de "Pendente" para "Confirmada"
3. **Estoque Automático**: O sistema deduzirá automaticamente o estoque
4. **Verificação**: Confira se há avisos de estoque insuficiente

### Se Precisar Cancelar
1. **Status Anterior**: Se a venda estava confirmada ou concluída
2. **Altere para Cancelada**: O estoque será restaurado automaticamente
3. **Contas a Receber**: Atualize manualmente as contas financeiras conforme necessário

## Avisos e Considerações

⚠️ **Avisos de Estoque**
- Avisos de estoque são informativos, não impedem a criação da venda
- Útil para vendas futuras ou produtos sob encomenda
- Recomenda-se resolver problemas de estoque antes de confirmar a venda

⚠️ **Depósito Padrão**
- O sistema usa o primeiro depósito ativo para controle de estoque
- Se nenhum depósito estiver ativo, haverá erro ao confirmar a venda
- Certifique-se de ter pelo menos um depósito cadastrado e ativo

⚠️ **Reversão de Estoque**
- Apenas vendas confirmadas ou concluídas podem ter estoque restaurado ao cancelar
- Vendas pendentes não afetam o estoque

## Estrutura do Banco de Dados

### Novo Campo
```sql
ALTER TABLE public.sales
ADD COLUMN employee_id UUID REFERENCES public.employees(id);
```

### Trigger de Estoque
```sql
-- Automaticamente gerencia estoque quando status da venda muda
CREATE TRIGGER trigger_sale_status_change
AFTER UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION handle_sale_status_change();
```

### Função de Verificação
```sql
-- Verifica disponibilidade de estoque antes da venda
check_sale_stock_availability(sale_items JSONB)
```

## Suporte e Troubleshooting

### Problema: Estoque não está sendo deduzido
**Solução:** Verifique se:
- O status foi alterado para "Confirmada" ou "Concluída"
- Existe um depósito ativo cadastrado
- Os produtos têm registro de estoque no sistema

### Problema: Erro ao confirmar venda
**Solução:** Verifique se:
- Há pelo menos um depósito ativo no sistema
- Os produtos existem e estão ativos
- Não há problemas de conexão com o banco de dados

### Problema: Vendedor não aparece na lista
**Solução:** Verifique se:
- O funcionário está cadastrado no sistema
- O funcionário tem um registro de pessoa (people) vinculado
- O cadastro está completo e ativo

## Próximas Melhorias Sugeridas
- [ ] Reserva de estoque ao criar venda pendente
- [ ] Histórico de movimentação de estoque por venda
- [ ] Relatório de vendas por vendedor
- [ ] Comissões automáticas para vendedores
- [ ] Múltiplos depósitos por venda
- [ ] Transferência automática entre depósitos
