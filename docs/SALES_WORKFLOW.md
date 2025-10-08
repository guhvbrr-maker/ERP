# Fluxo de Trabalho de Vendas - Guia Completo

## 📋 Visão Geral do Status

O sistema de vendas agora possui um gerenciamento de status mais robusto que automatiza várias operações:

```
┌─────────────┐
│   PENDENTE  │  ← Venda criada, estoque não afetado
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ CONFIRMADA  │  ← Estoque é DEDUZIDO automaticamente
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CONCLUÍDA  │  ← Venda finalizada, estoque já foi deduzido
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CANCELADA  │  ← Se vinha de CONFIRMADA/CONCLUÍDA, estoque é RESTAURADO
└─────────────┘
```

## 🎯 Cenários de Uso

### Cenário 1: Venda Simples com Estoque Disponível

**Passo a Passo:**
1. ✅ Criar nova venda
2. ✅ Selecionar cliente
3. ✅ Escolher vendedor responsável
4. ✅ Adicionar produto (Sistema verifica estoque ✓)
5. ✅ Definir forma de pagamento
6. ✅ Salvar venda (Status: PENDENTE)
7. ✅ Alterar status para CONFIRMADA
   - 🔄 Sistema deduz estoque automaticamente
   - 💰 Contas a receber já foram criadas
8. ✅ Processar entrega
9. ✅ Alterar status para CONCLUÍDA

**Resultado:**
- ✓ Venda registrada
- ✓ Estoque atualizado
- ✓ Contas a receber criadas
- ✓ Vendedor vinculado
- ✓ Entrega agendada

---

### Cenário 2: Venda com Estoque Baixo/Zerado

**Situação:** Cliente quer comprar produto que está com estoque zerado

**Passo a Passo:**
1. ✅ Criar nova venda
2. ✅ Selecionar cliente e vendedor
3. ⚠️ Adicionar produto
   - Sistema exibe alerta: **"ESTOQUE ZERADO"**
   - Badge vermelho aparece no produto
   - Alerta global no topo da lista de produtos
4. 💡 **Decisão:**
   - **Opção A:** Continuar com a venda (produto sob encomenda)
   - **Opção B:** Aguardar reposição de estoque
5. ✅ Salvar venda (Status: PENDENTE)
6. 🔄 Aguardar entrada de estoque
7. ✅ Quando estoque chegar, alterar para CONFIRMADA
   - Sistema deduz estoque normalmente

**Avisos Mostrados:**
```
⚠️ Atenção: Problemas de Estoque
Alguns produtos possuem estoque baixo ou zerado. A venda será criada, 
mas o estoque só será deduzido quando o status for alterado para 
"Confirmada" ou "Concluída".
⚠️ 1 produto(s) com ESTOQUE ZERADO!
```

---

### Cenário 3: Cancelamento de Venda

**Situação:** Cliente desiste da compra após confirmação

**Passo a Passo:**
1. 📋 Venda está com status CONFIRMADA
2. 📦 Estoque já foi deduzido
3. ❌ Cliente cancela
4. ✅ Alterar status para CANCELADA
   - 🔄 Sistema RESTAURA o estoque automaticamente
5. 💰 Atualizar contas a receber manualmente (se necessário)

**Importante:**
- ✓ Estoque é restaurado apenas de vendas CONFIRMADAS ou CONCLUÍDAS
- ✓ Vendas PENDENTES não afetam estoque, então não há o que restaurar

---

## 📊 Tabela de Produtos com Indicadores de Estoque

Durante a criação da venda, a tabela mostra:

| Produto | SKU | **Estoque** | Qtd | Preço Unit. | Desconto | Total | Ações |
|---------|-----|-------------|-----|-------------|----------|-------|-------|
| Sofá 3 Lugares<br/>🔴 **ESTOQUE ZERADO** | SOF-001 | **0** | 1 | R$ 2.500,00 | R$ 0,00 | R$ 2.500,00 | 🗑️ |
| Mesa de Jantar<br/>🟡 **Estoque baixo** | MES-002 | **3** | 1 | R$ 1.200,00 | R$ 0,00 | R$ 1.200,00 | 🗑️ |
| Cadeira Office | CAD-003 | **25** | 4 | R$ 450,00 | R$ 50,00 | R$ 1.750,00 | 🗑️ |

**Legenda de Cores:**
- 🔴 Vermelho: Estoque = 0 (ZERADO)
- 🟡 Amarelo: Estoque < 5 (BAIXO)
- 🟢 Verde: Estoque ≥ 5 (ADEQUADO)

---

## 🎨 Interface de Status na Tela de Detalhes

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ Gerenciamento Automático de Estoque                          │
│ Ao alterar o status para "Confirmada" ou "Concluída", o        │
│ estoque será automaticamente deduzido. Se cancelar uma venda    │
│ confirmada, o estoque será restaurado.                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Status da Venda  │  │ Status Pagamento │  │ Status Entrega   │
│                  │  │                  │  │                  │
│ [v] Pendente     │  │ [v] Pendente     │  │ [v] Pendente     │
│     Confirmada   │  │     Parcial      │  │     Agendada     │
│     Concluída    │  │     Pago         │  │     Em trânsito  │
│     Cancelada    │  │                  │  │     Entregue     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔑 Funcionalidades por Perfil de Usuário

### Vendedor
- ✅ Criar vendas e vincular-se a elas
- ✅ Ver alertas de estoque em tempo real
- ✅ Consultar suas vendas
- ✅ Verificar contas a receber vinculadas

### Gerente
- ✅ Todas as permissões de Vendedor
- ✅ Visualizar vendas de todos os vendedores
- ✅ Alterar status de vendas
- ✅ Gerenciar estoque e depósitos
- ✅ Configurar triggers e automações

### Financeiro
- ✅ Visualizar contas a receber geradas automaticamente
- ✅ Dar baixa em pagamentos
- ✅ Gerar relatórios financeiros

---

## 🛠️ Configuração Inicial Necessária

Antes de usar o sistema de vendas, certifique-se de:

1. ✅ **Cadastrar Depósitos**
   - Pelo menos 1 depósito deve estar ativo
   - O primeiro depósito ativo será usado por padrão

2. ✅ **Cadastrar Produtos**
   - Produtos com estoque registrado
   - Preço de venda definido
   - Status ativo

3. ✅ **Cadastrar Funcionários**
   - Vincular funcionários a pessoas
   - Definir cargos e permissões

4. ✅ **Configurar Formas de Pagamento**
   - Cadastrar métodos de pagamento
   - Definir taxas (se aplicável)

---

## 📈 Relatórios e Acompanhamento

### Métricas Disponíveis
- 📊 Vendas por vendedor
- 📦 Movimentação de estoque por venda
- 💰 Contas a receber pendentes
- ⚠️ Alertas de estoque baixo
- 📅 Vendas pendentes de confirmação

### Dashboard
O dashboard mostra:
- Vendas recentes
- Alertas de estoque baixo
- Entregas agendadas
- Total em vendas

---

## ❓ FAQ

### P: Posso criar uma venda com estoque zerado?
**R:** Sim! O sistema permite criar a venda e mostra alertas. Útil para vendas futuras ou produtos sob encomenda. O estoque só será deduzido quando confirmar a venda.

### P: E se eu cancelar uma venda por engano?
**R:** Se a venda estava confirmada, o estoque foi restaurado. Você pode criar uma nova venda ou alterar o status de volta (o estoque será deduzido novamente).

### P: As contas a receber são criadas automaticamente?
**R:** Sim! Quando você adiciona formas de pagamento na venda, o sistema cria automaticamente as contas a receber vinculadas.

### P: Como funciona o parcelamento?
**R:** Ao definir pagamentos parcelados, o sistema cria uma conta a receber para cada parcela, com datas de vencimento e valores calculados automaticamente.

### P: Posso ter múltiplos depósitos?
**R:** Sim, você pode cadastrar vários depósitos. O sistema usa o primeiro depósito ativo encontrado para controle de estoque das vendas.

### P: O que acontece se não houver depósito ativo?
**R:** Ao tentar confirmar uma venda sem depósito ativo, o sistema mostrará um erro. Cadastre e ative pelo menos um depósito antes.

---

## 🎓 Dicas de Melhores Práticas

1. 📋 **Sempre defina o vendedor** - Útil para relatórios e comissões futuras
2. 🔍 **Verifique alertas de estoque** - Antes de confirmar vendas
3. 📦 **Confirme vendas apenas quando tiver estoque** - Evita problemas operacionais
4. 💰 **Configure pagamentos corretamente** - Contas a receber serão criadas automaticamente
5. 📊 **Use status Pendente** - Para vendas que ainda não têm estoque ou aguardam aprovação
6. ✅ **Use Confirmada** - Apenas quando puder separar e enviar o produto
7. 🎯 **Use Concluída** - Quando a venda e entrega forem finalizadas
8. ❌ **Cancele com cuidado** - Afeta estoque se a venda estava confirmada
