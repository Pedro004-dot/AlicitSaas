// Status e configurações do sistema
export interface Status {
  running: boolean;
  message?: string;
  last_result?: {
    success: boolean;
    message: string;
    timestamp: string;
  } | null;
}

// Resposta padrão da API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  total?: number;
}

// Entidades principais
export interface Bid {
  id: string;
  pncp_id: string;
  objeto_compra: string;
  valor_total_estimado: number;
  uf: string;
  status: string;
  data_publicacao: string;
  modalidade_compra: string;
  modalidade_nome?: string;
  razao_social?: string;
}

export interface Company {
  id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj?: string;
  descricao_servicos_produtos: string;
  palavras_chave: string[];
  setor_atuacao?: string;
}

export interface Match {
  id: string;
  licitacao_id: string;
  empresa_id: string;
  score: number;
  tipo_match: string;
  timestamp: string;
  // Dados relacionados
  licitacao?: Bid;
 
  empresa?: {
    id: string;
    nome: string;
    razao_social?: string;
    cnpj?: string;
    setor_atuacao?: string;
  };
}

export interface CompanyMatch {
  empresa_id: string;
  empresa_nome: string;
  total_matches: number;
  melhor_score: number;
  valor_total_oportunidades: number;
}

// Detalhes expandidos
export interface BidDetail {
  id: string;
  pncp_id: string;
  objeto_compra: string;
  valor_total_estimado: number;
  uf: string;
  status: string;
  data_publicacao: string;
  modalidade_compra: string;
  orgao_entidade?: { razaoSocial?: string } | string;
  unidade_orgao?: { ufSigla?: string };
  data_abertura_proposta?: string;
  data_encerramento_proposta?: string;
  itens?: BidItem[];
  razao_social?: string;
  uf_nome?: string;
  nome_unidade?: string;
  municipio_nome?: string;
  codigo_ibge?: string;
  codigo_unidade?: string;
  orgao_cnpj?: string;
}

export interface BidItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  unidade_medida?: string;
  numero_item?: number;
}

// Configurações
export interface MatchingConfig {
  similarity_threshold_phase1: number;
  similarity_threshold_phase2: number;
  vectorizer_type: string;
  max_pages?: number;
  clear_matches?: boolean;
}

export interface VectorizerConfig {
  type: string;
  name: string;
  description: string;
  available: boolean;
  recommended: boolean;
  requires_api_key: boolean;
  requiresApiKey: boolean;
  performance: string;
  cost: string;
  icon?: string;
}

// Tipos de status global da aplicação
export interface AppStatus {
  daily_bids: Status;
  reevaluate: Status;
}

// Tipos de carregamento
export interface LoadingState {
  bids: boolean;
  companies: boolean;
  matches: boolean;
  companyMatches: boolean;
  status: boolean;
}

// Tipo para navegação (para usar com tabs ou páginas)
export type TabType = 'home' | 'licitacoes' | 'matches' | 'empresas'; 