import { config } from '../config/environment';

// Função utilitária para construir URLs da API
export const buildApiUrl = (endpoint: string): string => {
  const baseUrl = config.API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Função para fazer fetch com a URL base configurada
export const apiFetch = async (endpoint: string, options?: RequestInit): Promise<Response> => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};

// Função para fazer fetch e retornar JSON
export const apiFetchJson = async <T = any>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}; 