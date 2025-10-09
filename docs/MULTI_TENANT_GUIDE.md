# Guia de Multi-Tenancy e Controle de Acesso

Este documento explica como funciona o sistema multi-tenant (multi-inquilino) implementado no ERP.

## Visão Geral

O sistema agora suporta múltiplas organizações (empresas) compartilhando a mesma infraestrutura, com isolamento completo de dados entre elas.

## Arquitetura

### Níveis de Usuário

1. **Super Admin** 
   - Dono do sistema ERP
   - Acesso ao painel de controle global
   - Pode criar e gerenciar organizações
   - Pode ativar/desativar acesso de organizações
   - Vê dados consolidados de todas as organizações

2. **Admin de Organização**
   - Primeiro usuário da organização
   - Gerencia usuários dentro da sua organização
   - Acesso total aos recursos da sua organização
   - Não vê dados de outras organizações

3. **Usuários Regulares**
   - Funcionários cadastrados pelo Admin
   - Acesso baseado em roles (manager, vendedor, etc.)
   - Limitados à sua organização

### Estrutura de Dados

#### Tabela `organizations`
Armazena informações sobre cada empresa/organização:
- `id`: Identificador único
- `name`: Nome da organização
- `slug`: Identificador amigável para URLs
- `is_active`: Status de ativação (controle do Super Admin)
- `subscription_status`: trial, active, suspended, cancelled
- `max_users`: Limite de usuários
- `max_products`: Limite de produtos
- `max_sales_per_month`: Limite de vendas mensais

#### Tabela `organization_users`
Relaciona usuários às suas organizações:
- `organization_id`: Referência à organização
- `user_id`: Referência ao usuário
- `is_owner`: Indica se é o dono/admin da organização

#### Colunas `organization_id`
Adicionadas às tabelas principais para isolamento de dados:
- `people` (clientes, fornecedores, funcionários)
- `positions` (cargos)
- `categories` (categorias de produtos)
- `products` (produtos)
- `sales` (vendas)
- `inventory_items` (estoque)

## Fluxo de Cadastro

### Novo Cliente/Organização

1. **Super Admin cria a organização** no painel Super Admin
2. **Super Admin ou Admin cadastra o primeiro usuário** através do formulário de funcionários
3. **Primeiro usuário automaticamente vira Admin** da organização
4. **Admin pode cadastrar novos funcionários** na sua organização

### Cadastro Público Desabilitado

O cadastro público (`/signup`) foi desabilitado por segurança. A página agora:
- Redireciona automaticamente para `/login`
- Exibe mensagem informando sobre cadastro interno
- Orienta usuários a contatar um administrador

## Row Level Security (RLS)

### Políticas de Acesso

As políticas RLS garantem que:

1. **Super Admins** veem tudo
2. **Usuários regulares** veem apenas dados da sua organização
3. **Dados são automaticamente filtrados** por `organization_id`
4. **Inserções recebem automaticamente** o `organization_id` do usuário

### Exemplo de Política

```sql
-- Usuários só veem pessoas da sua organização
CREATE POLICY "Organization isolation"
ON public.people
FOR SELECT
USING (
  public.is_super_admin(auth.uid()) OR
  organization_id = public.get_user_organization_id(auth.uid())
);
```

## Triggers Automáticos

### `set_organization_id`
- Dispara antes de INSERT em tabelas principais
- Automaticamente define `organization_id` baseado no usuário
- Super Admins podem definir manualmente

### `auto_assign_first_admin`
- Dispara ao adicionar usuário em `organization_users`
- Se for o primeiro usuário, recebe role `admin` e flag `is_owner`

## Monitoramento e Limites

### Limites por Organização

O Super Admin pode definir limites para cada organização:
- **max_users**: Número máximo de usuários
- **max_products**: Número máximo de produtos
- **max_sales_per_month**: Limite mensal de vendas

### Monitoramento

O painel Super Admin mostra:
- Uso atual vs. limite de usuários
- Uso atual vs. limite de produtos
- Total de vendas
- Faturamento total
- Status de assinatura

## Status de Assinatura

Valores possíveis para `subscription_status`:

- **trial**: Período de teste
- **active**: Assinatura ativa
- **suspended**: Temporariamente suspensa
- **cancelled**: Cancelada

### Controle de Acesso

Quando `is_active = false`:
- Usuários da organização não conseguem fazer login
- Dados ficam preservados
- Super Admin pode reativar quando necessário

## Migração de Dados Existentes

Para sistemas já em produção:

```sql
-- 1. Criar uma organização padrão para dados existentes
INSERT INTO organizations (name, slug, is_active)
VALUES ('Organização Principal', 'default', true);

-- 2. Atribuir todos os dados existentes a esta organização
UPDATE people SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');
UPDATE products SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');
UPDATE sales SET organization_id = (SELECT id FROM organizations WHERE slug = 'default');
-- ... repetir para outras tabelas

-- 3. Vincular usuários existentes à organização
INSERT INTO organization_users (organization_id, user_id, is_owner)
SELECT 
  (SELECT id FROM organizations WHERE slug = 'default'),
  id,
  false
FROM auth.users;

-- 4. Atribuir admin ao primeiro usuário
UPDATE organization_users
SET is_owner = true
WHERE user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1);
```

## Melhores Práticas

### Para Super Admins

1. Crie organizações com informações completas
2. Defina limites apropriados desde o início
3. Monitore uso regularmente
4. Documente mudanças de status
5. Mantenha backup de dados críticos

### Para Admins de Organização

1. Cadastre funcionários com roles apropriadas
2. Revise permissões regularmente
3. Remova acessos de ex-funcionários prontamente
4. Monitore atividades suspeitas
5. Mantenha informações de contato atualizadas

### Para Desenvolvedores

1. Sempre considere `organization_id` em queries
2. Use as funções helper para checagens de permissão
3. Teste isolamento de dados entre organizações
4. Documente novas tabelas que precisam de isolamento
5. Considere impacto de performance em queries multi-tenant

## Troubleshooting

### Usuário não vê dados após login

1. Verifique se usuário está vinculado a uma organização:
   ```sql
   SELECT * FROM organization_users WHERE user_id = 'USER_ID';
   ```

2. Verifique se organização está ativa:
   ```sql
   SELECT * FROM organizations WHERE id = 'ORG_ID';
   ```

### Dados aparecem para organização errada

1. Verifique `organization_id` dos registros
2. Verifique se triggers estão ativos
3. Revise políticas RLS

### Super Admin não consegue criar organização

1. Verifique role do usuário:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'USER_ID';
   ```

2. Verifique se role é 'super_admin'

## Recursos Futuros

- [ ] Dashboard de analytics por organização
- [ ] Exportação de dados por organização
- [ ] Logs de auditoria detalhados
- [ ] Gestão de planos e preços
- [ ] API para integrações externas
- [ ] Whitelabel por organização
- [ ] Customização de features por plano

## Suporte

Para dúvidas sobre implementação multi-tenant, consulte a documentação técnica ou entre em contato com o time de desenvolvimento.
