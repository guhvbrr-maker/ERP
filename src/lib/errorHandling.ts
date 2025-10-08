export function mapDatabaseError(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado';

  const message = error.message || '';
  const code = error.code || '';

  // RLS policy violations
  if (message.includes('row-level security') || message.includes('policy')) {
    return 'Você não tem permissão para realizar esta ação';
  }

  // Postgres error codes
  switch (code) {
    case '23505': // unique_violation
      return 'Este registro já existe no sistema';
    case '23503': // foreign_key_violation
      return 'Não é possível excluir este registro pois está sendo usado';
    case '23502': // not_null_violation
      return 'Alguns campos obrigatórios não foram preenchidos';
    case '23514': // check_violation
      return 'Os dados fornecidos não atendem aos requisitos';
    case '42P01': // undefined_table
      return 'Recurso não encontrado';
    case 'PGRST116': // no rows returned
      return 'Registro não encontrado';
  }

  // Auth errors
  if (message.includes('Invalid login credentials')) {
    return 'Email ou senha incorretos';
  }
  if (message.includes('User already registered')) {
    return 'Este email já está cadastrado';
  }
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu email antes de fazer login';
  }

  // Generic fallback
  return 'Ocorreu um erro. Por favor, tente novamente';
}
