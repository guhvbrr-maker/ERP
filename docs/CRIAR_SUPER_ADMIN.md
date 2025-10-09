# Como Criar um Super Admin

Este documento explica como criar um usuário Super Admin com acesso total ao sistema ERP.

## 📋 O que você vai receber

Após executar o script, você receberá:
- **Email/Login**: Para acessar o sistema
- **Senha**: Gerada automaticamente de forma segura (16 caracteres)
- **Acesso Total**: Controle completo de todas as funcionalidades do sistema

## 🚀 Passos para Criar o Super Admin

### 1. Obter a Service Role Key do Supabase

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** (Configurações) > **API**
4. Na seção "Project API keys", copie a **service_role key** (⚠️ não a anon/public key)

### 2. Executar o Script

Abra um terminal na pasta raiz do projeto e execute:

#### Opção A: Com email gerado automaticamente
```bash
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui npm run setup:super-admin
```

#### Opção B: Com email personalizado
```bash
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui ADMIN_EMAIL=admin@minhaempresa.com npm run setup:super-admin
```

### 3. Salvar as Credenciais

O script exibirá algo assim:

```
═══════════════════════════════════════════════════════════
     ✅ SUPER ADMIN CRIADO COM SUCESSO!
═══════════════════════════════════════════════════════════

📋 CREDENCIAIS DE ACESSO:

   Login (Email): admin@minhaempresa.com
   Senha:         Xy9@mKp2!nQ7vB4z

🔗 Acesse o sistema em:
   https://seu-dominio.com/login

📚 Após o login, você terá acesso ao painel Super Admin em:
   Menu lateral > Super Admin
```

**⚠️ IMPORTANTE**: Copie e salve estas credenciais imediatamente! Elas não serão exibidas novamente.

### 4. Fazer Login no Sistema

1. Acesse a URL do seu sistema ERP
2. Vá para a página de login
3. Use o **Email** e **Senha** fornecidos pelo script
4. Após o login, você verá um link "Super Admin" no menu lateral

## 🎯 O que o Super Admin pode fazer?

Com acesso Super Admin, você pode:

- ✅ Ver todas as organizações/empresas do sistema
- ✅ Criar novas organizações
- ✅ Ativar/desativar acesso de organizações
- ✅ Monitorar estatísticas de uso de todas as organizações
- ✅ Gerenciar limites e licenças
- ✅ Ver dados consolidados de todo o sistema
- ✅ Acessar o painel administrativo especial

## 🔐 Segurança

### ⚠️ AVISOS IMPORTANTES

1. **Guarde as credenciais com segurança**
   - Use um gerenciador de senhas
   - Não compartilhe com outras pessoas
   - Não envie por email ou mensagens

2. **Super Admin tem acesso total**
   - Pode ver dados de TODAS as organizações
   - Pode modificar configurações do sistema
   - Tem privilégios administrativos máximos

3. **Limite o número de Super Admins**
   - Crie apenas os Super Admins necessários
   - Apenas pessoas de total confiança devem ter este acesso
   - Considere usar autenticação de dois fatores

## ❓ Problemas Comuns

### "Erro: SUPABASE_SERVICE_ROLE_KEY é obrigatória"
- Você esqueceu de passar a chave do Supabase
- Certifique-se de usar a **service_role key**, não a anon key

### "Falha ao criar usuário de autenticação"
- Verifique se a chave está correta
- Verifique sua conexão com a internet
- O email pode já estar em uso (tente outro email)

### "Falha ao atribuir role"
- As migrações do banco de dados podem não estar aplicadas
- Execute: `supabase db push` ou aplique as migrações manualmente
- Verifique se a tabela `user_roles` existe

## 📞 Suporte

Se você encontrar problemas:

1. Verifique se todas as migrações foram aplicadas
2. Consulte `docs/SUPER_ADMIN_SETUP.md` para outras opções
3. Verifique os logs do Supabase Dashboard
4. Entre em contato com o desenvolvedor do sistema

## 📚 Documentação Relacionada

- [SUPER_ADMIN_SETUP.md](./SUPER_ADMIN_SETUP.md) - Outras formas de criar Super Admin
- [MULTI_TENANT_GUIDE.md](./MULTI_TENANT_GUIDE.md) - Como funciona o multi-tenancy
- [scripts/README.md](../scripts/README.md) - Documentação dos scripts

## 🎉 Próximos Passos

Após criar o Super Admin:

1. Faça login no sistema
2. Acesse o painel Super Admin
3. Crie sua primeira organização
4. Cadastre os usuários da organização
5. Configure os limites e permissões

Agora você tem controle total do sistema ERP! 🚀
