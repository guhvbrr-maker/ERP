# Sistema ERP Completo para Loja de Móveis - Documentação

## 📋 Visão Geral do Sistema

O ERP Móveis Karina é um sistema completo e integrado para gestão de operações de uma loja de móveis, abrangendo todos os setores da empresa: vendas, compras, produção/montagem, entregas, assistência técnica, financeiro e business intelligence.

## 🏗️ Arquitetura do Sistema

### Módulos Implementados

```
┌─────────────────────────────────────────────────────────────┐
│                    ERP MÓVEIS KARINA                        │
├─────────────────────────────────────────────────────────────┤
│  VENDAS                    │  COMPRAS                       │
│  - Orçamentos              │  - Pedidos de Compra           │
│  - Pedidos                 │  - Sugestões Automáticas       │
│  - Comissões               │  - Workflow de Aprovação       │
│  - Metas                   │  - Gestão de Fornecedores      │
├────────────────────────────┼────────────────────────────────┤
│  PRODUÇÃO                  │  ENTREGAS                      │
│  - Ordens de Produção      │  - Agendamento                 │
│  - Controle de Etapas      │  - Rotas Otimizadas            │
│  - Bill of Materials (BOM) │  - Rastreamento                │
│  - Qualidade               │  - Montagens                   │
├────────────────────────────┼────────────────────────────────┤
│  FINANCEIRO                │  ASSISTÊNCIA TÉCNICA           │
│  - Contas a Receber        │  - Chamados                    │
│  - Contas a Pagar          │  - SLA Tracking                │
│  - Fluxo de Caixa          │  - Gestão de Garantias         │
│  - Conciliação Bancária    │  - Avaliação de Satisfação     │
├────────────────────────────┼────────────────────────────────┤
│  ESTOQUE                   │  PESSOAS                       │
│  - Movimentações           │  - Clientes                    │
│  - Inventário              │  - Funcionários                │
│  - Alertas                 │  - Fornecedores                │
│  - Múltiplos Depósitos     │  - Cargos/Permissões           │
├────────────────────────────┴────────────────────────────────┤
│                 BUSINESS INTELLIGENCE                        │
│  - Dashboard Analytics     - Relatórios Gerenciais           │
│  - KPIs em Tempo Real      - Análises Preditivas            │
│  - Gráficos Interativos    - Exportações                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Funcionalidades por Módulo

### 1. MÓDULO DE VENDAS

#### Funcionalidades Principais
- ✅ Criação de orçamentos e pedidos
- ✅ Gestão completa do ciclo de vendas
- ✅ Controle automático de estoque por status
- ✅ Múltiplas formas de pagamento
- ✅ Parcelamento automático
- ✅ Contas a receber automáticas
- ✅ Atribuição de vendedor
- ✅ **NOVO: Cálculo automático de comissões**
- ✅ **NOVO: Metas de vendas por período**
- ✅ **NOVO: Análise de performance por vendedor**

#### Workflow de Vendas
```
Orçamento (Pendente)
  ↓
Confirmada → Deduz Estoque → Gera Comissão
  ↓
Em Produção (se necessário)
  ↓
Pronta para Entrega
  ↓
Concluída → Registra Feedback
```

#### Comissões de Vendas
- **Tipos de Comissão**:
  - Percentual sobre valor total
  - Valor fixo por venda
  - Escalonada por faixa de valor
  
- **Cálculo Automático**: Comissão é calculada quando venda é concluída
- **Aprovação**: Gerente pode aprovar ou rejeitar comissões
- **Pagamento**: Controle de lotes de pagamento

#### Metas de Vendas
- Definição de metas mensais, trimestrais ou anuais
- Metas por:
  - Vendedor individual
  - Categoria de produtos
  - Empresa como um todo
- Acompanhamento automático de progresso
- Alertas de performance

### 2. MÓDULO DE COMPRAS

#### Funcionalidades Principais
- ✅ Pedidos de compra completos
- ✅ Sugestões automáticas baseadas em estoque mínimo
- ✅ Gestão de fornecedores
- ✅ Múltiplos itens por pedido
- ✅ Controle de recebimento
- ✅ **NOVO: Workflow de aprovação por valor**
- ✅ **NOVO: Rastreamento de status detalhado**
- ✅ **NOVO: Análise de performance de fornecedores**

#### Workflow de Aprovação
```
Rascunho
  ↓
Enviado → [Valor < R$ 5.000] → Sem aprovação necessária
  ↓       [Valor ≥ R$ 5.000] → Aguarda Aprovação Gerente
  ↓       [Valor ≥ R$ 20.000] → Aguarda Aprovação Diretor
Aprovado
  ↓
Confirmado → Aguarda Recebimento
  ↓
Parcialmente Recebido / Totalmente Recebido
  ↓
Atualiza Estoque
```

#### Status de Compra
- **Rascunho**: Em elaboração
- **Enviado**: Enviado ao fornecedor
- **Aguardando Aprovação**: Valor requer autorização
- **Aprovado**: Autorizado para prosseguir
- **Rejeitado**: Não autorizado
- **Confirmado**: Fornecedor confirmou
- **Parcialmente Recebido**: Recebimento parcial
- **Recebido**: Totalmente recebido
- **Cancelado**: Cancelado

### 3. MÓDULO DE PRODUÇÃO/MONTAGEM

#### Funcionalidades Principais
- ✅ **NOVO: Ordens de produção**
- ✅ **NOVO: Controle de etapas de produção**
- ✅ **NOVO: Bill of Materials (BOM)**
- ✅ **NOVO: Alocação de recursos**
- ✅ **NOVO: Controle de qualidade**
- ✅ Integração com vendas
- ✅ Agendamento de montagens

#### Ordem de Produção
```
Pendente → Agendamento
  ↓
Em Progresso → Etapas:
  ├─ Corte de materiais
  ├─ Montagem
  ├─ Acabamento
  └─ Controle de Qualidade
  ↓
Concluída → Disponível para Entrega
```

#### Etapas de Produção
1. **Corte**: Preparação de materiais
2. **Montagem**: Construção do móvel
3. **Acabamento**: Pintura, verniz, detalhes
4. **Controle de Qualidade**: Inspeção final
5. **Embalagem**: Preparação para envio

#### Bill of Materials (BOM)
- Lista de materiais necessários para cada produto
- Alocação automática de componentes do estoque
- Controle de quantidade utilizada vs. planejada
- Rastreamento de custos de produção

### 4. MÓDULO DE ENTREGAS

#### Funcionalidades Principais
- ✅ Agendamento de entregas
- ✅ Atribuição de entregadores
- ✅ Controle de status
- ✅ **NOVO: Rotas otimizadas**
- ✅ **NOVO: Rastreamento em tempo real**
- ✅ **NOVO: Múltiplas entregas por rota**
- ✅ Integração com montagens

#### Rotas de Entrega
```
Planejamento
  ↓
Otimização Automática → Ordem ideal de paradas
  ↓
Em Trânsito → Rastreamento
  ↓
Entregue → Confirmação com cliente
```

#### Otimização de Rotas
- Agrupa entregas por região
- Calcula rota mais eficiente
- Estima distância e tempo
- Atribui motorista/veículo
- Rastreia métricas reais vs. estimadas

### 5. MÓDULO DE ASSISTÊNCIA TÉCNICA

#### Funcionalidades Principais
- ✅ Gestão completa de chamados
- ✅ Status e prioridades
- ✅ Kanban visual
- ✅ **NOVO: SLA (Service Level Agreement)**
- ✅ **NOVO: Tracking automático de prazos**
- ✅ **NOVO: Alertas de vencimento**
- ✅ Histórico completo

#### SLA por Prioridade

| Prioridade | Tempo de Resposta | Tempo de Resolução |
|------------|-------------------|-------------------|
| Urgente    | 2 horas           | 24 horas          |
| Alta       | 4 horas           | 48 horas          |
| Normal     | 8 horas           | 120 horas (5 dias)|
| Baixa      | 24 horas          | 240 horas (10 dias)|

#### Status de SLA
- 🟢 **No Prazo**: Dentro do SLA
- 🟡 **Em Risco**: Próximo ao vencimento (< 20% do tempo)
- 🔴 **Vencido**: SLA ultrapassado

#### Workflow de Assistência
```
Aberto → [SLA: Resposta]
  ↓
Primeira Resposta → [SLA: Resolução]
  ↓
Em Progresso → Técnico atribuído
  ↓
Agendado → Data marcada com cliente
  ↓
Concluído → Feedback do cliente
```

### 6. MÓDULO FINANCEIRO

#### Funcionalidades Principais
- ✅ Contas a Receber
- ✅ Contas a Pagar
- ✅ Gestão de caixa e bancos
- ✅ Conciliação bancária
- ✅ Formas de pagamento
- ✅ Bandeiras de cartão
- ✅ **NOVO: DRE (Demonstrativo de Resultados)**
- ✅ **NOVO: Fluxo de caixa projetado**
- ✅ **NOVO: Análise de inadimplência**

#### Contas a Receber
- Criação automática na confirmação de vendas
- Parcelamento automático
- Controle de pagamentos parciais
- Baixa manual ou automática
- Alertas de vencimento
- Relatório de inadimplência

#### Contas a Pagar
- Registro manual ou via compras
- Agendamento de pagamentos
- Múltiplos fornecedores
- Categorização de despesas
- Aprovação de pagamentos

#### Fluxo de Caixa
- Visão consolidada: Entradas - Saídas
- Projeção futura baseada em contas pendentes
- Alertas de saldo negativo
- Gráficos de tendência

### 7. MÓDULO DE ESTOQUE

#### Funcionalidades Principais
- ✅ Múltiplos depósitos
- ✅ Movimentações rastreadas
- ✅ Inventário
- ✅ Reservas de estoque
- ✅ Alertas de estoque mínimo
- ✅ Integração automática com vendas
- ✅ Integração com compras
- ✅ Integração com produção

#### Tipos de Movimentação
- **Entrada**: Compra, devolução de cliente, ajuste
- **Saída**: Venda, devolução a fornecedor, perda, ajuste
- **Transferência**: Entre depósitos
- **Reserva**: Para vendas pendentes
- **Produção**: Consumo em manufatura

### 8. MÓDULO DE PESSOAS

#### Funcionalidades Principais
- ✅ Cadastro de clientes
- ✅ Gestão de funcionários
- ✅ Fornecedores
- ✅ Cargos e permissões
- ✅ Histórico de interações
- ✅ **NOVO: Avaliação de desempenho**
- ✅ **NOVO: Histórico de comissões**

#### Clientes
- Dados cadastrais completos
- Histórico de compras
- Contas em aberto
- Preferências de entrega
- Feedback e avaliações

#### Funcionários
- Dados pessoais
- Cargo e departamento
- Vendas realizadas
- Comissões ganhas
- Metas e performance

### 9. BUSINESS INTELLIGENCE

#### Dashboard Analytics
- **Métricas Financeiras**:
  - Vendas do mês e ano
  - Contas a receber e pagar
  - Fluxo de caixa
  - Margem de lucro
  
- **Métricas Operacionais**:
  - Pedidos ativos
  - Entregas pendentes
  - Assistências abertas
  - Produção em andamento
  
- **Métricas de Estoque**:
  - Itens em estoque
  - Valor em estoque
  - Produtos em falta
  - Giro de estoque

#### Relatórios Gerenciais

**Relatório de Vendas**:
- Performance por vendedor
- Top produtos
- Análise de ticket médio
- Taxa de conversão
- Metas vs. Realizado

**Relatório Financeiro**:
- DRE completo
- Fluxo de caixa diário
- Contas vencidas
- Previsão de recebimentos

**Relatório de Estoque**:
- Valor em estoque
- Produtos críticos
- Análise ABC
- Giro por categoria

**Relatório de Compras**:
- Performance de fornecedores
- Valor gasto por categoria
- Prazo de entrega médio

#### Gráficos e Visualizações
- Evolução de vendas (linha)
- Distribuição por categoria (pizza)
- Top produtos (barras)
- Fluxo de caixa (barras comparativas)
- Mapa de calor de vendas

### 10. FEEDBACK E SATISFAÇÃO DO CLIENTE

#### Funcionalidades Principais
- ✅ **NOVO: Avaliação pós-venda**
- ✅ **NOVO: Avaliação pós-assistência**
- ✅ **NOVO: Sistema de rating (1-5 estrelas)**
- ✅ **NOVO: Comentários e sugestões**
- ✅ **NOVO: Follow-up de feedbacks negativos**

#### Tipos de Feedback
- Venda concluída
- Assistência técnica
- Entrega
- Produto específico
- Atendimento geral

#### Métricas de Satisfação
- NPS (Net Promoter Score)
- Média de avaliações
- Taxa de resposta
- Principais reclamações
- Ações corretivas

## 🔄 Integrações Entre Módulos

### Fluxo Completo de Uma Venda

```
1. VENDA
   ├─ Cliente faz pedido
   ├─ Vendedor registra no sistema
   ├─ Sistema verifica estoque
   └─ Gera orçamento
   
2. CONFIRMAÇÃO
   ├─ Cliente aprova
   ├─ Estoque é reservado/deduzido
   ├─ Contas a receber criadas
   └─ Comissão calculada
   
3. PRODUÇÃO (se necessário)
   ├─ Ordem de produção gerada
   ├─ BOM alocado do estoque
   ├─ Etapas de produção
   └─ Controle de qualidade
   
4. ENTREGA
   ├─ Agendamento
   ├─ Rota otimizada
   ├─ Entrega realizada
   └─ Montagem (se necessário)
   
5. PÓS-VENDA
   ├─ Feedback do cliente
   ├─ Garantia registrada
   ├─ Assistência (se necessário)
   └─ Fidelização
   
6. FINANCEIRO
   ├─ Recebimentos
   ├─ Comissões pagas
   ├─ Fechamento no fluxo
   └─ Relatórios
```

## 📊 KPIs e Métricas do Sistema

### KPIs de Vendas
- Faturamento mensal/anual
- Ticket médio
- Taxa de conversão (orçamento → venda)
- Número de vendas por vendedor
- Meta vs. Realizado
- Comissões pagas

### KPIs Financeiros
- Receita total
- Despesas totais
- Lucro líquido
- Margem de lucro
- Fluxo de caixa
- Inadimplência
- Dias médios de recebimento

### KPIs Operacionais
- Tempo médio de produção
- Taxa de defeitos
- Prazo de entrega cumprido
- SLA de assistência cumprido
- Tempo médio de atendimento
- Taxa de satisfação do cliente

### KPIs de Estoque
- Giro de estoque
- Cobertura de estoque (dias)
- Acuracidade de inventário
- Valor imobilizado
- Produtos sem giro
- Taxa de ruptura

### KPIs de Compras
- Prazo médio de entrega
- Conformidade de pedidos
- Valor economizado em negociações
- Número de fornecedores ativos
- Taxa de devolução a fornecedores

## 🔐 Segurança e Permissões

### Perfis de Usuário

**Administrador**:
- Acesso total ao sistema
- Configurações
- Relatórios financeiros completos
- Aprovações de compras
- Gestão de usuários

**Gerente**:
- Visualização de todos os módulos
- Relatórios gerenciais
- Aprovação de compras até R$ 20.000
- Gestão de equipe
- Definição de metas

**Vendedor**:
- Módulo de vendas
- Suas próprias vendas
- Catálogo de produtos
- Consulta de estoque
- Suas comissões

**Financeiro**:
- Contas a receber/pagar
- Conciliação bancária
- Relatórios financeiros
- Aprovação de pagamentos

**Estoquista**:
- Gestão de estoque
- Movimentações
- Inventário
- Recebimento de compras

**Técnico**:
- Assistências técnicas
- Suas ordens de serviço
- Agendamentos

## 📱 Recursos do Sistema

### Interface
- ✅ Design responsivo (desktop, tablet, mobile)
- ✅ Tema claro/escuro
- ✅ Navegação intuitiva
- ✅ Busca global
- ✅ Atalhos de teclado

### Usabilidade
- ✅ Drag and drop em Kanban
- ✅ Filtros avançados
- ✅ Ordenação customizável
- ✅ Exportação para CSV/Excel
- ✅ Impressão de documentos
- ✅ Notificações em tempo real

### Performance
- ✅ Cache inteligente
- ✅ Paginação eficiente
- ✅ Queries otimizadas
- ✅ Índices de banco
- ✅ Lazy loading

## 🚀 Próximas Melhorias Sugeridas

### Curto Prazo
- [ ] App mobile nativo
- [ ] Notificações push
- [ ] Chat interno entre equipes
- [ ] Integração com WhatsApp
- [ ] Assinatura eletrônica de contratos

### Médio Prazo
- [ ] IA para previsão de demanda
- [ ] Recomendação de produtos
- [ ] Chatbot de atendimento
- [ ] Integração com marketplaces
- [ ] API pública para integrações

### Longo Prazo
- [ ] CRM completo
- [ ] Programa de fidelidade
- [ ] E-commerce integrado
- [ ] Sistema de franquias
- [ ] Business Intelligence avançado com ML

---

**Versão:** 2.0.0  
**Data:** Janeiro 2025  
**Autor:** Sistema ERP - Móveis Karina  
**Status:** Produção - Sistema Completo
