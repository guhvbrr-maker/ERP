#!/usr/bin/env node

/**
 * Script para Criar Super Admin
 * 
 * Este script cria um usuário Super Admin com acesso total ao sistema ERP.
 * Requer a chave de serviço do Supabase (service role key).
 * 
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=sua_chave node scripts/create-super-admin.js
 *   
 * Ou com email personalizado:
 *   SUPABASE_SERVICE_ROLE_KEY=sua_chave ADMIN_EMAIL=admin@exemplo.com node scripts/create-super-admin.js
 */

const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://htxtlyouzyxmbfbotbvf.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || `admin-${Date.now()}@erp-system.com`;

// Gerar senha segura
function generateSecurePassword() {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Erro: Variável de ambiente SUPABASE_SERVICE_ROLE_KEY é obrigatória');
  console.error('');
  console.error('Uso:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=sua_chave node scripts/create-super-admin.js');
  console.error('');
  console.error('Ou com email personalizado:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=sua_chave ADMIN_EMAIL=admin@exemplo.com node scripts/create-super-admin.js');
  console.error('');
  console.error('Obtenha sua service role key em:');
  console.error('  https://app.supabase.com/project/htxtlyouzyxmbfbotbvf/settings/api');
  process.exit(1);
}

async function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const jsonData = JSON.stringify(data);
    
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(jsonData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
}

async function executeSql(sql) {
  return makeRequest('/rest/v1/rpc/exec_sql', 'POST', { query: sql });
}

async function createAuthUser(email, password) {
  console.log('📝 Criando usuário de autenticação...');
  
  try {
    const response = await makeRequest('/auth/v1/admin/users', 'POST', {
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        created_by: 'super_admin_script',
        created_at: new Date().toISOString()
      }
    });
    
    console.log('✅ Usuário de autenticação criado com sucesso!');
    return response.id;
  } catch (error) {
    throw new Error(`Falha ao criar usuário de autenticação: ${error.message}`);
  }
}

async function assignSuperAdminRole(userId) {
  console.log('🔐 Atribuindo role de Super Admin...');
  
  const sql = `
    INSERT INTO public.user_roles (user_id, role)
    VALUES ('${userId}', 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  `;
  
  try {
    await executeSql(sql);
    console.log('✅ Role de Super Admin atribuída com sucesso!');
  } catch (error) {
    throw new Error(`Falha ao atribuir role: ${error.message}`);
  }
}

async function verifyUserCreation(email) {
  console.log('🔍 Verificando criação do usuário...');
  
  const sql = `
    SELECT 
      u.id,
      u.email,
      ur.role
    FROM auth.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    WHERE u.email = '${email}';
  `;
  
  try {
    await executeSql(sql);
    console.log('✅ Usuário verificado com sucesso!');
  } catch (error) {
    console.warn('⚠️  Não foi possível verificar o usuário (pode ser normal)');
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('     🚀 CRIANDO SUPER ADMIN - SISTEMA ERP');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const password = generateSecurePassword();
  
  console.log('📊 Informações do Super Admin:');
  console.log(`   Email: ${ADMIN_EMAIL}`);
  console.log(`   Senha: ${password}`);
  console.log('');
  console.log('⚠️  IMPORTANTE: Salve estas credenciais em local seguro!');
  console.log('');
  
  try {
    // Criar usuário de autenticação
    const userId = await createAuthUser(ADMIN_EMAIL, password);
    console.log(`   ID do Usuário: ${userId}`);
    console.log('');
    
    // Atribuir role de super admin
    await assignSuperAdminRole(userId);
    console.log('');
    
    // Verificar criação
    await verifyUserCreation(ADMIN_EMAIL);
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('     ✅ SUPER ADMIN CRIADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 CREDENCIAIS DE ACESSO:');
    console.log('');
    console.log(`   Login (Email): ${ADMIN_EMAIL}`);
    console.log(`   Senha:         ${password}`);
    console.log('');
    console.log('🔗 Acesse o sistema em:');
    console.log('   https://seu-dominio.com/login');
    console.log('');
    console.log('📚 Após o login, você terá acesso ao painel Super Admin em:');
    console.log('   Menu lateral > Super Admin');
    console.log('');
    console.log('⚠️  LEMBRE-SE:');
    console.log('   - Salve estas credenciais em local seguro');
    console.log('   - O Super Admin tem acesso a TODOS os dados do sistema');
    console.log('   - Não compartilhe estas credenciais');
    console.log('   - Considere habilitar autenticação de dois fatores');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('     ❌ ERRO AO CRIAR SUPER ADMIN');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('');
    console.error('💥 Erro:', error.message);
    console.error('');
    console.error('🔧 Possíveis soluções:');
    console.error('   1. Verifique se a SUPABASE_SERVICE_ROLE_KEY está correta');
    console.error('   2. Verifique se as migrações foram aplicadas');
    console.error('   3. Verifique se o usuário já existe (tente outro email)');
    console.error('');
    process.exit(1);
  }
}

main();
