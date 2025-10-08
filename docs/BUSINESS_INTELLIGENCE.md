# Business Intelligence - Documentação Completa

## 📊 Visão Geral

O módulo de Business Intelligence (BI) do ERP Móveis Karina oferece análises avançadas e relatórios gerenciais completos para tomada de decisões estratégicas. Este módulo centraliza todas as informações do sistema em dashboards interativos e relatórios exportáveis.

## 🎯 Funcionalidades Principais

### 1. Dashboard Analytics

Dashboard principal com visão consolidada de todas as operações:

#### Métricas Financeiras
- **Vendas do Mês**: Total de vendas realizadas no mês atual
- **Vendas do Ano**: Acumulado anual de vendas
- **Contas a Receber**: Total pendente de recebimento
- **Contas a Pagar**: Total pendente de pagamento
- **Fluxo de Caixa**: Diferença entre receber e pagar

#### Métricas de Estoque
- **Estoque Adequado**: Produtos com estoque acima do mínimo
- **Estoque Baixo**: Produtos próximos ao limite mínimo
- **Sem Estoque**: Produtos esgotados
- **Valor em Estoque**: Valor total do inventário (custo)
- **Valor Potencial**: Valor total se vendido (preço de venda)
- **Lucro Potencial**: Diferença entre valor de venda e custo

#### Gráficos Interativos
- **Evolução de Vendas**: Gráfico de linha mostrando vendas dos últimos 6 meses
- **Vendas por Status**: Gráfico de pizza com distribuição de vendas por status
- **Top 10 Produtos**: Gráfico de barras com produtos mais vendidos

### 2. Relatório de Vendas

Análise completa do desempenho de vendas:

#### Filtros Disponíveis
- **Período**: Data inicial e final
- **Vendedor**: Filtrar por funcionário específico ou todos
- **Status**: Filtrar por status da venda (pendente, confirmada, concluída, cancelada)

#### Métricas Calculadas
- **Total em Vendas**: Soma de todas as vendas no período
- **Número de Vendas**: Quantidade de vendas realizadas
- **Ticket Médio**: Valor médio por venda
- **Vendedores Ativos**: Quantidade de vendedores com vendas no período

#### Análises
- **Performance por Vendedor**: Tabela com ranking de vendedores mostrando:
  - Número de vendas
  - Total vendido
  - Ticket médio
- **Detalhamento de Vendas**: Lista completa de todas as vendas com:
  - Número da venda
  - Data
  - Cliente
  - Vendedor
  - Status
  - Valor total

#### Exportação
- Exportar relatório completo em formato CSV
- Dados formatados e prontos para análise em Excel

### 3. Relatório Financeiro

Análise detalhada da situação financeira:

#### Filtros
- **Período**: Data inicial e final baseado em data de vencimento

#### Métricas
- **Total a Receber**: Valor pendente de recebimento
- **Total Recebido**: Valor já pago pelos clientes
- **Total a Pagar**: Valor pendente de pagamento a fornecedores
- **Total Pago**: Valor já pago a fornecedores
- **Fluxo de Caixa**: Diferença entre receber e pagar
- **Resultado do Período**: Lucro ou prejuízo total

#### Visualizações
- **Gráfico de Fluxo Diário**: Barras comparativas de contas a receber e pagar por dia
- **Tabela de Contas a Receber**: Lista detalhada de recebíveis
- **Tabela de Contas a Pagar**: Lista detalhada de pagamentos pendentes

#### Exportação
- CSV com todas as contas a receber e a pagar do período

### 4. Relatório de Estoque

Análise completa do inventário:

#### Métricas
- **Total de Produtos**: Quantidade de SKUs cadastrados
- **Estoque Adequado**: Produtos com estoque satisfatório
- **Estoque Baixo**: Produtos que precisam reposição
- **Sem Estoque**: Produtos esgotados

#### Análises Financeiras
- **Valor em Estoque (Custo)**: Capital investido em estoque
- **Valor de Venda Potencial**: Receita possível com venda total
- **Lucro Potencial**: Margem de lucro do estoque atual

#### Análises por Categoria
- Agrupamento de produtos por categoria
- Quantidade de itens por categoria
- Valor total por categoria

#### Detalhamento
Tabela completa com todos os produtos mostrando:
- Nome do produto e SKU
- Categoria
- Depósito
- Quantidade disponível e reservada
- Quantidade mínima
- Status do estoque (adequado, baixo, zerado)
- Valor total (custo × quantidade)

#### Exportação
- CSV com todo o detalhamento do estoque

### 5. Relatório de Compras

Análise de desempenho de compras:

#### Filtros
- **Período**: Data inicial e final

#### Métricas
- **Total em Compras**: Valor total gasto em compras
- **Número de Compras**: Quantidade de pedidos de compra
- **Valor Médio**: Ticket médio por compra
- **Fornecedores**: Quantidade de fornecedores utilizados

#### Análises
- **Compras por Fornecedor**: Ranking de fornecedores com:
  - Quantidade de compras
  - Valor total
  - Ticket médio
- **Top 10 Produtos Comprados**: Produtos mais adquiridos com:
  - Quantidade total
  - Valor total investido
- **Detalhamento de Compras**: Lista de todos os pedidos

#### Exportação
- CSV com todas as compras do período

## 🚀 Como Utilizar

### Acessando o Módulo

1. No menu lateral, clique em **Relatórios** (ícone de gráfico de barras)
2. Selecione a aba desejada:
   - **Dashboard**: Visão geral de todas as métricas
   - **Vendas**: Análise de vendas
   - **Financeiro**: Análise financeira
   - **Estoque**: Análise de inventário
   - **Compras**: Análise de aquisições

### Gerando Relatórios

#### Passo a Passo Básico

1. **Selecione os Filtros**
   - Defina o período desejado
   - Escolha filtros específicos (vendedor, status, etc.)

2. **Clique em "Gerar Relatório"**
   - O sistema processará os dados
   - Métricas e gráficos serão exibidos

3. **Analise os Resultados**
   - Visualize as métricas em cards
   - Explore os gráficos interativos
   - Navegue pelas tabelas detalhadas

4. **Exporte se Necessário**
   - Clique em "Exportar CSV"
   - Arquivo será baixado automaticamente
   - Abra no Excel para análises adicionais

### Dicas de Análise

#### Análise de Vendas
- **Compare períodos**: Gere relatórios de meses diferentes para identificar tendências
- **Monitore vendedores**: Identifique top performers e quem precisa suporte
- **Analise ticket médio**: Identifique oportunidades de upselling

#### Análise Financeira
- **Monitore fluxo de caixa**: Verifique diariamente para evitar problemas de liquidez
- **Programe pagamentos**: Use o gráfico diário para planejar pagamentos
- **Acompanhe inadimplência**: Foque em contas vencidas

#### Análise de Estoque
- **Reponha produtos críticos**: Priorize produtos sem estoque ou com estoque baixo
- **Otimize capital**: Identifique produtos parados para promoções
- **Analise por categoria**: Identifique categorias com melhor desempenho

#### Análise de Compras
- **Negocie com fornecedores**: Use dados de volume para negociar preços
- **Diversifique fornecedores**: Evite dependência de um único fornecedor
- **Planeje compras**: Use histórico para prever necessidades futuras

## 📈 Indicadores Chave (KPIs)

### KPIs de Vendas
- **Faturamento Mensal**: Target mensal de vendas
- **Taxa de Conversão**: % de orçamentos que viram vendas
- **Ticket Médio**: Valor médio por venda
- **Crescimento**: % de crescimento vs. mês anterior

### KPIs Financeiros
- **Fluxo de Caixa**: Deve ser positivo consistentemente
- **Dias de Recebimento**: Tempo médio para receber
- **Margem de Lucro**: % de lucro sobre vendas

### KPIs de Estoque
- **Giro de Estoque**: Quantas vezes o estoque foi renovado
- **Cobertura de Estoque**: Dias de venda que o estoque cobre
- **Acuracidade**: % de produtos com estoque correto

### KPIs de Compras
- **Prazo de Entrega**: Tempo médio entre pedido e recebimento
- **Taxa de Conformidade**: % de compras recebidas corretamente
- **Economia**: Economia obtida em negociações

## 🎨 Recursos Visuais

### Tipos de Gráficos Disponíveis

1. **Gráficos de Linha**
   - Evolução temporal de métricas
   - Ideal para identificar tendências
   - Usado em: Vendas mensais, fluxo de caixa

2. **Gráficos de Barras**
   - Comparação entre categorias
   - Ideal para rankings
   - Usado em: Top produtos, comparação de vendedores

3. **Gráficos de Pizza**
   - Distribuição percentual
   - Ideal para proporções
   - Usado em: Vendas por status, categorias de produtos

### Paleta de Cores

- 🟢 **Verde**: Métricas positivas, valores a receber, estoque adequado
- 🔴 **Vermelho**: Alertas, valores a pagar, estoque zerado
- 🟡 **Amarelo**: Avisos, estoque baixo, itens pendentes
- 🔵 **Azul**: Informações neutras, dados gerais

## 🔧 Configurações Avançadas

### Personalizando Períodos

Os relatórios permitem análises personalizadas por período:
- **Hoje**: Dados do dia atual
- **Esta Semana**: Últimos 7 dias
- **Este Mês**: Mês atual completo
- **Mês Passado**: Mês anterior completo
- **Este Ano**: Ano fiscal atual
- **Personalizado**: Defina início e fim manualmente

### Filtros Avançados

Combine múltiplos filtros para análises específicas:
- Vendas de um vendedor específico em um período
- Produtos de uma categoria com estoque baixo
- Compras de um fornecedor no trimestre
- Contas a receber vencidas de um cliente

## 📊 Melhores Práticas

### Frequência de Análise

1. **Diária**
   - Dashboard principal
   - Fluxo de caixa
   - Alertas de estoque

2. **Semanal**
   - Performance de vendedores
   - Contas a receber vencidas
   - Compras pendentes

3. **Mensal**
   - Relatório completo de vendas
   - Análise financeira completa
   - Giro de estoque
   - Avaliação de fornecedores

4. **Trimestral**
   - Análise de tendências
   - Planejamento estratégico
   - Renegociação com fornecedores

### Tomada de Decisão

Use os relatórios para:
- **Pricing**: Ajustar preços baseado em margem e competitividade
- **Compras**: Decidir o que comprar e quando
- **RH**: Avaliar performance de vendedores
- **Marketing**: Focar em produtos e categorias mais rentáveis
- **Financeiro**: Planejar investimentos e controlar custos

## 🆘 Solução de Problemas

### Relatório Não Carrega
- Verifique sua conexão com internet
- Confirme que tem permissão de acesso
- Tente reduzir o período analisado

### Dados Não Batem
- Verifique se os filtros estão corretos
- Confirme que as vendas canceladas estão excluídas
- Verifique se o período inclui todas as datas necessárias

### Exportação Falha
- Verifique se o relatório foi gerado primeiro
- Tente usar um navegador diferente
- Verifique permissões de download do navegador

## 🔒 Segurança e Permissões

O acesso ao módulo de BI requer:
- Usuário autenticado no sistema
- Permissões de visualização de dados financeiros
- Alguns relatórios podem ter restrições por cargo

Gerentes e administradores têm acesso completo a todos os relatórios.

## 🎓 Treinamento

Para melhor aproveitamento do módulo:
1. Familiarize-se com o dashboard primeiro
2. Explore cada tipo de relatório
3. Pratique com diferentes filtros
4. Exporte e analise os dados no Excel
5. Crie rotina de análise regular

---

**Versão:** 2.0.0  
**Data:** Janeiro 2025  
**Autor:** Sistema ERP - Móveis Karina

