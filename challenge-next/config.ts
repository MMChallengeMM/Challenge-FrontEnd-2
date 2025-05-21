// Arquivo de configuração da aplicação

// URL base da API - altere conforme necessário para desenvolvimento/produção
export const API_BASE_URL = 'http://localhost:8080';

// Configurações de autenticação
export const AUTH_CONFIG = {
  // Tempo de expiração do token em minutos
  tokenExpirationTime: 60,
  // Nome do header para envio do token
  tokenHeader: 'Authorization',
  // Prefixo do token (Bearer, JWT, etc)
  tokenPrefix: 'Bearer',
};

// Configurações de timeout para requisições
export const REQUEST_TIMEOUT = 30000; // 30 segundos