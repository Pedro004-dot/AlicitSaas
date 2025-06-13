// Configuração de ambiente para a aplicação
export const config = {
  // URL base da API - vem da variável de ambiente ou fallback para desenvolvimento
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5002/api',
  
  // Outras configurações que podem ser necessárias
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  
  // Indicador de ambiente
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Função utilitária para obter a URL completa da API
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Log da configuração em desenvolvimento
if (config.IS_DEVELOPMENT) {
  console.log('🔧 Configuração da API:', {
    baseUrl: config.API_BASE_URL,
    environment: process.env.NODE_ENV,
  });
} 