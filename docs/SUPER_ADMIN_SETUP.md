# Configuração do Super Admin

Este documento explica como configurar o primeiro usuário Super Admin do sistema.

## O que é o Super Admin?

O Super Admin é o dono do sistema ERP e tem acesso ao painel administrativo especial que permite:

- Ver todas as organizações/empresas que usam o sistema
- Ativar/desativar acesso de organizações
- Criar novas organizações
- Monitorar estatísticas de uso de todas as organizações
- Gerenciar licenças e assinaturas

## Como Criar o Primeiro Super Admin

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard
2. Vá para "Table Editor"
3. Selecione a tabela `auth.users`
4. Encontre o usuário que deseja tornar Super Admin
5. Copie o `id` do usuário
6. Vá para a tabela `user_roles`
7. Clique em "Insert" e adicione:
   - `user_id`: Cole o ID do usuário
   - `role`: Selecione `super_admin`
   - Clique em "Save"

### Opção 2: Via SQL

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Substitua 'email@example.com' pelo email do usuário
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role
FROM auth.users
WHERE email = 'email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### Opção 3: Script Automatizado (Recomendado para novos usuários)

Se você tem acesso ao ambiente de desenvolvimento, pode criar um novo Super Admin automaticamente:

```bash
# Método 1: Usar npm script (email gerado automaticamente)
SUPABASE_SERVICE_ROLE_KEY=sua_chave npm run setup:super-admin

# Método 2: Especificar email personalizado
SUPABASE_SERVICE_ROLE_KEY=sua_chave ADMIN_EMAIL=admin@empresa.com npm run setup:super-admin

# Método 3: Executar diretamente
SUPABASE_SERVICE_ROLE_KEY=sua_chave node scripts/create-super-admin.cjs
```

**O que o script faz:**
- Cria um novo usuário no Supabase Auth
- Gera uma senha segura automaticamente
- Atribui a role `super_admin` ao usuário
- Exibe as credenciais de login (email e senha)

**Importante:**
- Salve as credenciais exibidas em local seguro
- A senha é gerada aleatoriamente e só será exibida uma vez
- Obtenha a service role key em: https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api

## Acessando o Painel Super Admin

Após configurar o usuário Super Admin:

1. Faça login no sistema com a conta configurada
2. Na barra lateral, você verá um novo link "Super Admin" destacado
3. Clique para acessar o painel de administração

## Funcionalidades do Painel Super Admin

### Dashboard Principal
- Total de organizações cadastradas
- Total de usuários no sistema
- Total de vendas
- Faturamento total

### Gerenciamento de Organizações
- Lista de todas as organizações
- Status de cada organização (Ativa/Inativa)
- Estatísticas de uso por organização:
  - Número de usuários
  - Número de produtos
  - Número de vendas
  - Faturamento total
- Ativar/desativar acesso de organizações
- Criar novas organizações

### Recursos Futuros
- Análise de uso de recursos
- Gestão de licenças e assinaturas
- Logs de auditoria
- Relatórios consolidados
- Integrações e APIs

## Segurança

⚠️ **IMPORTANTE**: 
- Apenas conceda permissão de Super Admin para usuários confiáveis
- O Super Admin tem acesso a dados de todas as organizações
- Mantenha as credenciais do Super Admin seguras
- Considere usar autenticação de dois fatores para contas Super Admin

## Cadastro Público Desabilitado

Por questões de segurança, o cadastro público foi desabilitado. Novos usuários devem ser cadastrados de duas formas:

1. **Para Super Admins**: Criar novas organizações através do painel Super Admin
2. **Para Admins de Organização**: Cadastrar novos funcionários através do menu Pessoas > Funcionários

O primeiro usuário de cada organização automaticamente recebe permissões de Admin da organização.

## Suporte

Para questões sobre configuração do Super Admin, entre em contato com o desenvolvedor do sistema.
