/**
 * Mensagens de validação dos DTOs do módulo Auth.
 * Usadas nos decorators do class-validator (RegisterDto, LoginDto).
 */
export const AUTH_DTO_MESSAGES = {
  // Email
  EMAIL_REQUIRED: 'Email é obrigatório',
  EMAIL_INVALID: 'Email inválido',
  EMAIL_MIN: 'Email deve ter pelo menos 5 caracteres',
  EMAIL_MAX: 'Email deve ter no máximo 50 caracteres',
  EMAIL_NO_SPACES: 'Email não pode conter espaços',

  // Username
  USERNAME_REQUIRED: 'Username é obrigatório',
  USERNAME_MIN: 'Username deve ter pelo menos 3 caracteres',
  USERNAME_MAX: 'Username deve ter no máximo 30 caracteres',
  USERNAME_CHARS: 'Username só pode conter letras, números, underscore e ponto',
  USERNAME_EDGES: 'Username não pode começar ou terminar com ponto ou underscore',
  USERNAME_NO_SPACES: 'Username não pode conter espaços',

  // Senha
  PASSWORD_REQUIRED: 'Senha é obrigatória',
  PASSWORD_MIN: 'Senha deve ter pelo menos 8 caracteres',
  PASSWORD_MAX: 'Senha deve ter no máximo 20 caracteres',
  PASSWORD_UPPERCASE: 'Senha deve conter pelo menos uma letra maiúscula',
  PASSWORD_LOWERCASE: 'Senha deve conter pelo menos uma letra minúscula',
  PASSWORD_NUMBER: 'Senha deve conter pelo menos um número',
  PASSWORD_SPECIAL: 'Senha deve conter pelo menos um caractere especial',

  // Confirmação de senha
  CONFIRM_REQUIRED: 'Confirmação de senha é obrigatória',
  CONFIRM_MIN: 'Confirmação deve ter pelo menos 8 caracteres',
  CONFIRM_MAX: 'Confirmação deve ter no máximo 20 caracteres',
  CONFIRM_MISMATCH: 'As senhas não coincidem',

  // Nome de exibição
  DISPLAY_NAME_REQUIRED: 'Nome de exibição é obrigatório',
  DISPLAY_NAME_MIN: 'Nome deve ter pelo menos 2 caracteres',
  DISPLAY_NAME_MAX: 'Nome deve ter no máximo 100 caracteres',

  // Token de recuperação de senha
  RESET_TOKEN_REQUIRED: 'Token é obrigatório',
} as const;
