# Guia de Novas Funcionalidades - ERP Móveis Karina

## 🎉 Bem-vindo às Novas Funcionalidades!

Este guia apresenta as funcionalidades recém-implementadas que transformam o ERP Móveis Karina em um sistema ainda mais completo, inteligente e colaborativo.

## 📋 Índice

1. [Gerenciamento de Tarefas](#gerenciamento-de-tarefas)
2. [Chat Interno](#chat-interno)
3. [Sistema de Notificações](#sistema-de-notificações)
4. [Dashboard Inteligente](#dashboard-inteligente)
5. [Automações e Inteligência](#automações-e-inteligência)

---

## 📋 Gerenciamento de Tarefas

### O que é?
Um sistema completo para organizar, atribuir e acompanhar tarefas da equipe, integrado com todos os módulos do ERP.

### Como Acessar
- Clique em **Tarefas** no menu lateral
- Ou navegue para `/tarefas`

### Principais Recursos

#### 1. Visualizações Flexíveis
- **Kanban Board**: Visualização em colunas com drag & drop
- **Lista**: Visualização tabular detalhada
- Alternância fácil entre visualizações

#### 2. Criação Rápida de Tarefas
1. Clique em "Nova Tarefa"
2. Preencha:
   - Título (obrigatório)
   - Descrição
   - Status
   - Prioridade
   - Departamento
   - Responsável
   - Prazo
3. Salve e pronto!

#### 3. Prioridades Inteligentes
- 🔴 **Urgente**: Atenção imediata necessária
- 🟠 **Alta**: Importante, mas pode aguardar um pouco
- 🔵 **Normal**: Prioridade padrão
- ⚫ **Baixa**: Pode ser feito quando houver tempo

#### 4. Filtros Poderosos
Combine múltiplos filtros:
- Por status (Pendente, Em Andamento, etc.)
- Por prioridade
- Por departamento
- Por funcionário atribuído

#### 5. Notificações Automáticas
O sistema notifica automaticamente:
- Quando você recebe uma nova tarefa
- 24h antes do prazo de vencimento
- Quando uma tarefa está vencida
- Quando uma tarefa que você criou é concluída

### Exemplo de Uso

**Cenário**: Venda #123 precisa ser entregue

1. **Criar Tarefa**:
   - Título: "Preparar entrega - Venda #123"
   - Departamento: Entrega
   - Atribuir a: João (motorista)
   - Prioridade: Alta
   - Prazo: Amanhã 14h

2. **João recebe notificação** imediatamente

3. **João move a tarefa** de "Pendente" para "Em Andamento" (drag & drop)

4. **Sistema envia alerta** 24h antes se não concluída

5. **João marca como concluída** após a entrega

6. **Criador da tarefa é notificado** da conclusão

### Dicas de Produtividade

✅ **Para Gerentes**:
- Crie tarefas recorrentes para processos padronizados
- Use prioridades de forma consistente
- Revise tarefas vencidas semanalmente

✅ **Para Funcionários**:
- Verifique suas tarefas ao iniciar o dia
- Atualize o status conforme progride
- Comunique bloqueios imediatamente

---

## 💬 Chat Interno

### O que é?
Sistema de mensagens em tempo real para comunicação rápida e eficiente entre equipes.

### Como Acessar
- Clique em **Chat** no menu lateral
- Ou navegue para `/chat`

### Principais Recursos

#### 1. Canais Organizados
- **Canal Geral**: Para toda a empresa
- **Canais de Departamento**: Um para cada setor
- **Canais de Projeto**: Para equipes específicas
- **Canais Privados**: Para discussões restritas

#### 2. Criação de Canais
1. Clique no botão **+** ao lado de "Chat Interno"
2. Configure:
   - Nome do canal
   - Descrição
   - Tipo (Geral, Departamento, Equipe)
   - Departamento (se aplicável)
   - Privacidade (Público/Privado)
3. Crie e comece a conversar!

#### 3. Envio de Mensagens
- Digite no campo de texto
- **Enter**: Envia a mensagem
- **Shift + Enter**: Nova linha
- Mensagens aparecem instantaneamente

#### 4. Histórico Completo
- Todas as mensagens são salvas
- Role para cima para ver mensagens antigas
- Contexto sempre disponível

### Canais Padrão Criados

| Canal | Propósito | Tipo |
|-------|-----------|------|
| # Geral | Avisos gerais da empresa | Público |
| # Vendas | Coordenação de vendas | Departamento |
| # Produção | Gestão de produção | Departamento |
| # Entrega | Logística de entregas | Departamento |
| # Financeiro | Questões financeiras | Departamento |
| # Assistência Técnica | Suporte técnico | Departamento |
| # Compras | Gestão de compras | Departamento |
| # Administração | Administração geral | Departamento |

### Exemplo de Uso

**Cenário**: Problema urgente na entrega

1. **Motorista entra no canal # Entrega**
2. **Envia mensagem**: "Cliente não está no endereço da venda #123"
3. **Gerente de Vendas vê a mensagem** (está no mesmo canal)
4. **Responde rapidamente**: "Vou ligar para o cliente agora"
5. **Problema resolvido** em minutos, sem precisar de ligações ou e-mails

### Melhores Práticas

✅ **Use o canal correto**:
- Questões de vendas → # Vendas
- Problemas técnicos → # Assistência Técnica
- Avisos gerais → # Geral

✅ **Seja profissional**:
- Mensagens claras e objetivas
- Evite conversas pessoais em canais de trabalho
- Respeite horários de trabalho

✅ **Responda prontamente**:
- Mensagens urgentes devem ser respondidas rapidamente
- Confirme recebimento de informações importantes

---

## 🔔 Sistema de Notificações

### O que é?
Central de notificações inteligente que mantém você informado sobre tudo que é importante.

### Como Acessar
- Clique no ícone de **sino (🔔)** no cabeçalho
- Badge vermelho mostra quantidade de notificações não lidas

### Tipos de Notificações

| Ícone | Tipo | Quando Acontece |
|-------|------|-----------------|
| 📋 | Tarefa Atribuída | Você recebe uma nova tarefa |
| ⏰ | Tarefa Vencendo | 24h antes do prazo |
| 🚨 | Tarefa Vencida | Prazo passou |
| ✅ | Tarefa Concluída | Tarefa que você criou foi finalizada |
| 💬 | Mensagem no Chat | Nova mensagem em canal |
| 🛒 | Status de Venda | Mudança em venda |
| 📦 | Compra Aprovada | Pedido de compra aprovado |
| 🚚 | Entrega Agendada | Nova entrega programada |
| 🔧 | Assistência Atribuída | Novo chamado técnico |

### Como Usar

1. **Ver Notificações**:
   - Clique no sino
   - Lista de notificações aparece

2. **Ler Notificação**:
   - Clique na notificação
   - Navegue automaticamente para o item relacionado
   - Marca como lida automaticamente

3. **Marcar Todas como Lidas**:
   - Clique em "Marcar todas como lidas"
   - Limpa todas as notificações não lidas

### Recursos Inteligentes

- **Atualização Automática**: Refresh a cada 30 segundos
- **Badge de Contagem**: Veja quantas notificações não lidas você tem
- **Navegação Direta**: Clique e vá direto ao que precisa ver
- **Histórico Completo**: Veja as últimas 10 notificações

---

## 📊 Dashboard Inteligente

### O que mudou?
O dashboard agora inclui um widget de tarefas que mostra suas tarefas pendentes.

### Widget de Tarefas

Localizado no dashboard principal, mostra:
- Até 5 tarefas pendentes mais urgentes
- Ordenadas por data de vencimento
- Indicadores visuais de prioridade
- Alertas de tarefas vencidas
- Botão "Ver todas" para ir à página completa

### Como Funciona

1. **Carregamento Automático**:
   - Ao abrir o dashboard
   - Mostra apenas SUAS tarefas
   - Estados: Pendente, Em Andamento, Bloqueado

2. **Informações Exibidas**:
   - Prioridade (com ícone)
   - Status atual
   - Título da tarefa
   - Departamento
   - Data de vencimento
   - Alerta se vencida

3. **Interação**:
   - Clique em qualquer tarefa
   - Navega para a página de tarefas
   - Veja todos os detalhes

---

## 🤖 Automações e Inteligência

### O que o Sistema Faz Sozinho

#### 1. Notificações Automáticas

**Quando você recebe uma tarefa**:
```
Sistema detecta nova atribuição
    ↓
Cria notificação automaticamente
    ↓
Você vê o sino vermelho
    ↓
Clica e vai direto à tarefa
```

**24h antes do prazo**:
```
Sistema verifica tarefas não concluídas
    ↓
Identifica as que vencem em 24h
    ↓
Envia notificação de alerta
    ↓
Você vê e prioriza a tarefa
```

#### 2. Transições Automáticas de Status

**Quando você marca uma data de início**:
```
Campo "started_at" preenchido
    ↓
Sistema muda status de "Pendente" para "Em Andamento"
    ↓
Atualização automática
```

**Quando você marca como concluída**:
```
Campo "completed_at" preenchido
    ↓
Sistema muda status para "Concluído"
    ↓
Notifica o criador da tarefa
```

#### 3. Atribuição por Departamento

Quando você cria uma tarefa:
```
Seleciona departamento
    ↓
Sistema sugere funcionários daquele departamento
    ↓
Atribuição mais rápida e precisa
```

#### 4. Priorização Inteligente

No dashboard de tarefas:
```
Sistema ordena por:
1. Tarefas vencidas (primeiro)
2. Data de vencimento (mais próximo)
3. Prioridade (urgente → baixa)
    ↓
Você vê o mais importante primeiro
```

### Triggers do Banco de Dados

O sistema usa triggers SQL para automações instantâneas:

1. **Notificação de Nova Tarefa**:
   - Trigger: `trigger_notify_task_assignment`
   - Quando: Nova tarefa com assignee
   - Ação: Cria notificação automaticamente

2. **Verificação de Prazos**:
   - Função: `check_task_due_dates()`
   - Quando: Executada periodicamente
   - Ação: Cria notificações para tarefas vencendo

3. **Atualização de Status**:
   - Trigger: `trigger_auto_update_task_status`
   - Quando: Campos de data são alterados
   - Ação: Atualiza status automaticamente

4. **Timestamp Automático**:
   - Trigger: `update_updated_at_column`
   - Quando: Qualquer atualização
   - Ação: Atualiza campo `updated_at`

---

## 🎯 Fluxos de Trabalho Recomendados

### 1. Gestão de Vendas com Tarefas

```
Nova Venda Criada
    ↓
[Gerente] Cria tarefa: "Separar produtos - Venda #123"
    ↓
[Estoquista] Recebe notificação
    ↓
[Estoquista] Separa produtos e marca como concluída
    ↓
[Gerente] Recebe notificação de conclusão
    ↓
[Gerente] Cria tarefa: "Entregar - Venda #123"
    ↓
[Motorista] Recebe notificação
    ↓
Ciclo continua...
```

### 2. Coordenação de Produção com Chat

```
Problema na produção detectado
    ↓
[Operador] Envia mensagem no # Produção
    ↓
[Supervisor] Vê imediatamente
    ↓
[Supervisor] Responde com solução
    ↓
[Operador] Resolve problema
    ↓
Produção normalizada em minutos
```

### 3. Atendimento ao Cliente

```
Cliente liga com problema
    ↓
[Atendente] Cria tarefa de assistência técnica
    ↓
[Técnico] Recebe notificação
    ↓
[Técnico] Vê detalhes da tarefa
    ↓
[Técnico] Coordena via # Assistência Técnica
    ↓
[Técnico] Resolve e marca como concluída
    ↓
[Atendente] Notificado da conclusão
    ↓
[Atendente] Liga para o cliente confirmando
```

---

## 📈 Métricas e Indicadores

### Tarefas
- Total de tarefas criadas
- Taxa de conclusão
- Tempo médio de conclusão
- Tarefas vencidas por funcionário
- Tarefas por departamento
- Distribuição de prioridades

### Chat
- Canais ativos
- Mensagens por dia
- Usuários mais ativos
- Canais mais utilizados

### Notificações
- Taxa de leitura
- Tempo médio até leitura
- Notificações por tipo
- Ações tomadas após notificação

---

## 💡 Dicas de Ouro

### Para Máxima Produtividade

1. **Comece o Dia Certo**:
   - Abra o dashboard
   - Veja suas tarefas pendentes
   - Priorize o dia

2. **Use Notificações Ativamente**:
   - Verifique o sino regularmente
   - Responda prontamente
   - Mantenha zerado sempre que possível

3. **Comunique-se pelo Chat**:
   - Perguntas rápidas → Chat
   - Discussões longas → Reunião
   - Documentação → Sistema

4. **Organize Tarefas**:
   - Uma tarefa = Uma ação clara
   - Use prioridades de forma consistente
   - Atualize status em tempo real

5. **Aproveite Automações**:
   - Confie nas notificações
   - Use transições automáticas
   - Deixe o sistema trabalhar para você

---

## 🚀 Próximos Passos

Agora que você conhece todas as funcionalidades, experimente:

1. ✅ Criar sua primeira tarefa
2. ✅ Enviar uma mensagem no chat
3. ✅ Verificar suas notificações
4. ✅ Explorar o dashboard atualizado
5. ✅ Integrar com seu fluxo de trabalho

## 📞 Precisa de Ajuda?

- Consulte a documentação completa em `/docs`
- Entre em contato com o administrador do sistema
- Use o canal # Geral para dúvidas gerais

---

**Aproveite as novas funcionalidades e tenha um trabalho mais produtivo!** 🎉

---

*Última atualização: Janeiro 2025*
*Versão: 1.0*
