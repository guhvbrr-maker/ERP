# Documentação do Sistema de Vendas Aprimorado

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Novos Recursos](#novos-recursos)
3. [Documentação Detalhada](#documentação-detalhada)
4. [Como Usar](#como-usar)
5. [Migração do Banco de Dados](#migração-do-banco-de-dados)

## 🎯 Visão Geral

Este conjunto de melhorias transforma o sistema de vendas em uma solução completa e automatizada, incluindo:

- ✅ **Atribuição de Vendedor** - Vincule cada venda a um funcionário responsável
- ✅ **Gerenciamento Automático de Estoque** - Dedução e restauração automática baseada no status
- ✅ **Alertas de Estoque em Tempo Real** - Avisos visuais para estoque baixo ou zerado
- ✅ **Contas a Receber Automáticas** - Já existente, mantido e aprimorado
- ✅ **Interface Aprimorada** - Visualizações claras e intuitivas

## 🚀 Novos Recursos

### 1. Campo Vendedor
Cada venda agora pode ter um vendedor atribuído, facilitando:
- Rastreamento de performance
- Relatórios por vendedor
- Comissões (futuro)

### 2. Controle Automático de Estoque
**Status: Pendente → Confirmada/Concluída**
- ✅ Estoque é deduzido automaticamente
- ✅ Sistema verifica disponibilidade
- ✅ Avisos são registrados se houver problemas

**Status: Confirmada/Concluída → Cancelada**
- ✅ Estoque é restaurado automaticamente
- ✅ Reversão segura da operação anterior

### 3. Avisos Visuais de Estoque
- 🔴 **Estoque Zerado** - Badge vermelho + alerta destacado
- 🟡 **Estoque Baixo** - Badge amarelo + aviso
- 🟢 **Estoque OK** - Indicador verde, sem avisos

### 4. Coluna de Estoque
Nova coluna na tabela de produtos mostra:
- Quantidade disponível
- Cor baseada no nível de estoque
- Atualização em tempo real

## 📖 Documentação Detalhada

### [SALES_MANAGEMENT_IMPROVEMENTS.md](./SALES_MANAGEMENT_IMPROVEMENTS.md)
Documentação técnica completa incluindo:
- Descrição de cada recurso
- Estrutura do banco de dados
- Troubleshooting
- Considerações técnicas

### [SALES_WORKFLOW.md](./SALES_WORKFLOW.md)
Guia prático de uso incluindo:
- Fluxos de trabalho detalhados
- Cenários de uso reais
- Exemplos visuais
- FAQ completo
- Melhores práticas

## 🎓 Como Usar

### Criando uma Nova Venda

1. **Acesse** Vendas → Nova Venda
2. **Selecione** o cliente (ou digite manualmente)
3. **Escolha** o vendedor responsável ⭐ NOVO
4. **Adicione** produtos
   - Observe os alertas de estoque ⭐ NOVO
   - Coluna de estoque mostra disponibilidade ⭐ NOVO
5. **Configure** formas de pagamento
6. **Salve** a venda (status: Pendente)

### Confirmando uma Venda

1. **Abra** a venda nos detalhes
2. **Observe** o alerta sobre gerenciamento automático ⭐ NOVO
3. **Altere** o status para "Confirmada"
4. **Automático**: Estoque é deduzido ⭐ NOVO

### Cancelando uma Venda

1. **Abra** a venda confirmada
2. **Altere** status para "Cancelada"
3. **Automático**: Estoque é restaurado ⭐ NOVO

## 🗄️ Migração do Banco de Dados

A migração `20251009000000_improve_sales_management.sql` adiciona:

### 1. Novo Campo
```sql
ALTER TABLE public.sales
ADD COLUMN employee_id UUID REFERENCES public.employees(id);
```

### 2. Trigger de Estoque
```sql
CREATE TRIGGER trigger_sale_status_change
AFTER UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION handle_sale_status_change();
```

### 3. Função de Verificação
```sql
CREATE FUNCTION check_sale_stock_availability(sale_items JSONB)
RETURNS TABLE(...);
```

## ⚙️ Configuração Necessária

Antes de usar, certifique-se de ter:

- ✅ Pelo menos 1 **depósito ativo** cadastrado
- ✅ **Produtos** com estoque registrado
- ✅ **Funcionários** cadastrados no sistema
- ✅ **Formas de pagamento** configuradas

## 🔍 Verificação Rápida

Para verificar se tudo está funcionando:

1. ✅ Criar uma venda com vendedor
2. ✅ Adicionar produto e ver alerta de estoque
3. ✅ Salvar venda como Pendente
4. ✅ Verificar estoque atual do produto
5. ✅ Alterar status para Confirmada
6. ✅ Verificar estoque foi deduzido
7. ✅ Alterar para Cancelada
8. ✅ Verificar estoque foi restaurado

## 🎨 Capturas de Tela

### Nova Venda com Vendedor
- Campo "Vendedor" ao lado de "Data da Venda"
- Dropdown com lista de funcionários

### Alertas de Estoque
- Badge vermelho: "ESTOQUE ZERADO"
- Badge amarelo: "Estoque baixo"
- Alerta global no topo da lista

### Coluna de Estoque
- Número em vermelho: 0 disponível
- Número em amarelo: < 5 disponível
- Número em verde: ≥ 5 disponível

### Detalhes da Venda
- Campo "Vendedor" exibido nos dados do cliente
- Alerta sobre gerenciamento automático de estoque

## 🐛 Resolução de Problemas

### Estoque não está sendo deduzido
1. Verifique se há depósito ativo
2. Confirme que o status mudou para Confirmada/Concluída
3. Verifique logs do banco de dados

### Vendedor não aparece
1. Confirme que funcionário está cadastrado
2. Verifique vínculo com tabela `people`
3. Recarregue a página

### Erro ao confirmar venda
1. Verifique se há depósito ativo
2. Confirme que produtos estão ativos
3. Veja console do navegador para detalhes

## 📞 Suporte

Para mais informações, consulte:
- [Documentação Técnica](./SALES_MANAGEMENT_IMPROVEMENTS.md)
- [Guia de Workflow](./SALES_WORKFLOW.md)
- Issues no GitHub

## 🎯 Próximos Passos

Sugestões para melhorias futuras:
- [ ] Reserva de estoque para vendas pendentes
- [ ] Relatórios por vendedor
- [ ] Cálculo automático de comissões
- [ ] Múltiplos depósitos por venda
- [ ] Histórico de movimentação de estoque

---

**Versão:** 1.0.0  
**Data:** Janeiro 2025  
**Autor:** Sistema ERP - Móveis Karina
