// Arquivo de configuração da aplicação

// URL base da API
export const API_BASE_URL = 'https://mmobilidade-api-production.up.railway.app';

// Configurações de autenticação
export const AUTH_CONFIG = {
  // Tempo de expiração do token em minutos
  tokenExpirationTime: 60,
  // Nome do header para envio do token
  tokenHeader: 'Authorization',
  // Prefixo do token 
  tokenPrefix: 'Bearer',
};

// Configurações de timeout para requisições
export const REQUEST_TIMEOUT = 30000; // 30 segundos