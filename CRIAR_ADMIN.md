# 🔐 Criar Super Admin - Guia Rápido

Este é o guia rápido para criar um usuário com **acesso total** ao sistema ERP.

## ⚡ Início Rápido (2 minutos)

### 1️⃣ Obter a Service Role Key

Acesse: https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api

Copie a **service_role key** (⚠️ NÃO é a anon key)

### 2️⃣ Executar o Comando

```bash
# Cole sua chave no lugar de "sua_chave_aqui"
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui npm run setup:super-admin
```

Ou com email personalizado:

```bash
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui ADMIN_EMAIL=admin@empresa.com npm run setup:super-admin
```

### 3️⃣ Copiar as Credenciais

O script mostrará:

```
📋 CREDENCIAIS DE ACESSO:

   Login (Email): admin@empresa.com
   Senha:         Xy9@mKp2!nQ7vB4z
```

**⚠️ Salve estas credenciais imediatamente!**

### 4️⃣ Fazer Login

1. Acesse seu sistema ERP
2. Use o email e senha fornecidos
3. Pronto! Você tem acesso total ao sistema

## 🎯 O que você pode fazer?

Com o Super Admin você pode:

- ✅ Gerenciar todas as organizações
- ✅ Criar novas empresas no sistema
- ✅ Ver estatísticas de todo o sistema
- ✅ Controlar acessos e permissões
- ✅ Monitorar uso de recursos

## 📚 Documentação Completa

Para informações detalhadas, consulte:
- [docs/CRIAR_SUPER_ADMIN.md](docs/CRIAR_SUPER_ADMIN.md) - Guia completo em português
- [docs/SUPER_ADMIN_SETUP.md](docs/SUPER_ADMIN_SETUP.md) - Documentação técnica

## ❓ Problemas?

**Erro de chave?**
- Use a **service_role key**, não a anon key

**Email já existe?**
- Use outro email: `ADMIN_EMAIL=outro@email.com npm run setup:super-admin`

**Outros problemas?**
- Veja o guia completo: [docs/CRIAR_SUPER_ADMIN.md](docs/CRIAR_SUPER_ADMIN.md)

---

🚀 **Pronto para começar? Execute o comando acima e receba suas credenciais!**
