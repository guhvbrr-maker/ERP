# ✅ Checklist: Criar Super Admin e Obter Credenciais

Siga este checklist para criar seu usuário com acesso total ao sistema:

## 📋 Pré-requisitos

- [ ] Ter acesso ao projeto no Supabase
- [ ] Ter Node.js instalado
- [ ] Ter o repositório clonado localmente
- [ ] Ter instalado as dependências (`npm install`)

## 🔑 Passo 1: Obter a Service Role Key

- [ ] Acessar https://app.supabase.com
- [ ] Entrar no projeto: `htxtlyouzyxmbfbotbvf`
- [ ] Ir em **Settings** > **API**
- [ ] Copiar a **service_role** (não a anon key)
- [ ] Salvar a chave temporariamente (vamos usar no próximo passo)

## 💻 Passo 2: Executar o Script

- [ ] Abrir o terminal
- [ ] Navegar até a pasta do projeto
- [ ] Escolher um email para o Super Admin
- [ ] Executar o comando:

```bash
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui ADMIN_EMAIL=seu@email.com npm run setup:super-admin
```

**Substitua:**
- `sua_chave_aqui` → pela service_role key copiada
- `seu@email.com` → pelo email desejado

## 📝 Passo 3: Copiar as Credenciais

Quando o script terminar, você verá:

```
📋 CREDENCIAIS DE ACESSO:

   Login (Email): seu@email.com
   Senha:         Xy9@mKp2!nQ7vB4z
```

- [ ] Copiar o **Login (Email)**
- [ ] Copiar a **Senha**
- [ ] Salvar em local seguro (gerenciador de senhas recomendado)

⚠️ **ATENÇÃO:** A senha só será exibida esta vez! Não perca!

## 🔐 Passo 4: Armazenar com Segurança

- [ ] Salvar as credenciais em um gerenciador de senhas, OU
- [ ] Salvar em arquivo criptografado, OU
- [ ] Salvar no cofre de senhas da empresa

**NÃO:**
- [ ] ❌ Não salvar em arquivo .txt sem criptografia
- [ ] ❌ Não enviar por email
- [ ] ❌ Não deixar em post-it

## 🚀 Passo 5: Testar o Acesso

- [ ] Abrir o sistema ERP no navegador
- [ ] Clicar em "Entrar" ou ir para `/login`
- [ ] Inserir o **email** copiado
- [ ] Inserir a **senha** copiada
- [ ] Clicar em "Entrar"

## ✨ Passo 6: Verificar Permissões

Após fazer login, verificar:

- [ ] Você conseguiu fazer login com sucesso
- [ ] Vê o link "Super Admin" no menu lateral (destacado)
- [ ] Consegue clicar em "Super Admin"
- [ ] Vê o painel administrativo
- [ ] Vê estatísticas do sistema
- [ ] Pode criar novas organizações

## 📚 Passo 7: Documentar

- [ ] Anotar onde salvou as credenciais
- [ ] Documentar para equipe (se necessário)
- [ ] Ler sobre o que o Super Admin pode fazer

## 🎯 Próximos Passos (Opcional)

Agora que você tem acesso Super Admin:

- [ ] Criar sua primeira organização
- [ ] Configurar limites de uso
- [ ] Cadastrar outros administradores (se necessário)
- [ ] Ativar autenticação de dois fatores
- [ ] Explorar o painel administrativo

## ❓ Problemas Comuns

### O comando não funciona?
- [ ] Verificar se está na pasta correta do projeto
- [ ] Verificar se o Node.js está instalado: `node --version`
- [ ] Verificar se as dependências estão instaladas: `npm install`

### Erro de service_role key?
- [ ] Verificar se copiou a chave correta (service_role, não anon)
- [ ] Verificar se a chave está completa (começa com `eyJ...`)
- [ ] Verificar se não tem espaços antes/depois da chave

### Email já existe?
- [ ] Usar outro email: `ADMIN_EMAIL=outro@email.com`
- [ ] Verificar se já criou este usuário antes

### Não vejo "Super Admin" no menu?
- [ ] Fazer logout e login novamente
- [ ] Verificar se o script terminou com sucesso
- [ ] Verificar os logs do navegador (F12 > Console)

## 📖 Documentação de Apoio

Se precisar de mais informações:

- **Guia Rápido:** [CRIAR_ADMIN.md](CRIAR_ADMIN.md)
- **Guia Completo:** [docs/CRIAR_SUPER_ADMIN.md](docs/CRIAR_SUPER_ADMIN.md)
- **Exemplo de Output:** [docs/EXEMPLO_OUTPUT_SUPER_ADMIN.md](docs/EXEMPLO_OUTPUT_SUPER_ADMIN.md)
- **Resposta Completa:** [RESPOSTA_USUARIO.md](RESPOSTA_USUARIO.md)

---

## ✅ Conclusão

Quando todos os itens estiverem marcados:

🎉 **Parabéns!** Você agora tem:
- ✅ Login (Email) do Super Admin
- ✅ Senha segura
- ✅ Acesso total ao sistema
- ✅ Capacidade de gerenciar tudo

**Próximo passo:** Fazer login e explorar o painel Super Admin! 🚀

---

💡 **Dica:** Guarde este checklist para criar outros Super Admins no futuro!
