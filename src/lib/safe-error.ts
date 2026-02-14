/**
 * Maps database/API errors to safe, user-friendly messages.
 * Prevents leaking internal details (table names, columns, constraints).
 */
export function getSafeErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Ocorreu um erro. Tente novamente.";
  }

  const code = (error as { code?: string }).code;

  switch (code) {
    case "23505":
      return "Este registro já existe.";
    case "23503":
      return "Erro de referência: registro relacionado não encontrado.";
    case "23514":
      return "Dados inválidos. Verifique os valores informados.";
    case "42501":
    case "PGRST116":
      return "Acesso negado.";
    case "PGRST301":
      return "Registro não encontrado.";
    default:
      return "Ocorreu um erro. Tente novamente.";
  }
}
