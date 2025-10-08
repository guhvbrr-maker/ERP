export function mapDatabaseError(error: any): string {
  if (!error) return 'Ocorreu um erro. Por favor, tente novamente';
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code;
  
  // RLS violations
  if (message.includes('row-level security') || message.includes('rls')) {
    return 'Você não tem permissão para realizar esta ação';
  }
  
  // Unique constraint violations
  if (code === '23505') {
    return 'Este registro já existe no sistema';
  }
  
  // Foreign key violations
  if (code === '23503') {
    return 'Não é possível excluir este registro pois está sendo usado';
  }
  
  // Not null violations
  if (code === '23502') {
    return 'Por favor, preencha todos os campos obrigatórios';
  }
  
  // Check constraint violations
  if (code === '23514') {
    return 'Os dados fornecidos não são válidos';
  }
  
  // Authentication errors
  if (message.includes('invalid login') || message.includes('invalid credentials')) {
    return 'Email ou senha incorretos';
  }
  
  if (message.includes('email not confirmed')) {
    return 'Por favor, confirme seu email antes de fazer login';
  }
  
  if (message.includes('user already registered')) {
    return 'Este email já está cadastrado';
  }
  
  // Generic fallback
  return 'Ocorreu um erro. Por favor, tente novamente';
}
