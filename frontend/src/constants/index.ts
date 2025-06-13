import { VectorizerConfig } from '../types';
import { config } from '../config/environment';

export const API_BASE_URL = config.API_BASE_URL;

export const VECTORIZER_OPTIONS: VectorizerConfig[] = [
  {
    type: 'sentence_transformers',
    name: 'SentenceTransformers (Ativo)',
    description: 'Modelo local open-source baseado em transformers. Boa performance, gratuito e totalmente offline.',
    available: true,
    recommended: true,
    requires_api_key: false,
    requiresApiKey: false,
    performance: 'medium',
    cost: 'free',
    icon: 'target'
  }
  // Outras opções comentadas para futuro uso:
  // {
  //   type: 'hybrid',
  //   name: 'Sistema Híbrido',
  //   description: 'OpenAI + SentenceTransformers como fallback (Requer API key)',
  //   available: false,
  //   recommended: false,
  //   requires_api_key: true,
  //   performance: 'high',
  //   cost: 'paid'
  // },
  // {
  //   type: 'openai',
  //   name: 'OpenAI Embeddings',
  //   description: 'Embeddings da OpenAI usando text-embedding-3-large. Alta qualidade mas pago.',
  //   available: false,
  //   recommended: false,
  //   requires_api_key: true,
  //   performance: 'high',
  //   cost: 'paid'
  // },
  // {
  //   type: 'mock',
  //   name: 'Mock (Teste)',
  //   description: 'Vetorizador de teste que gera scores aleatórios para desenvolvimento.',
  //   available: true,
  //   recommended: false,
  //   requires_api_key: false,
  //   performance: 'low',
  //   cost: 'free'
  // }
]; 