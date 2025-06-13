import React, { useState, useEffect } from 'react';
import { Search, Filter, X, MapPin, Calendar, DollarSign, FileText, Eye, ChevronDown } from 'lucide-react';

interface LicitacaoItem {
  id: string;
  numero_item: number;
  descricao: string;
  quantidade: string;
  unidade_medida: string;
  valor_unitario_estimado: string;
  valor_total?: string;
}

interface Licitacao {
  id: string;
  pncp_id: string;
  objeto_compra: string;
  uf: string;
  data_encerramento_proposta: string | null;
  valor_total_estimado: number;
  status: string;
  data_publicacao: string | null;
  modalidade_nome: string;
  situacao_compra_nome: string;
  processo: string;
  orgao_entidade: any;
  unidade_orgao: any;
  informacao_complementar: string;
  itens?: LicitacaoItem[];
  // Campos calculados do backend
  status_calculado?: string;
  valor_display?: number | string;
  razao_social?: string;
  // Novos campos da unidadeOrgao
  uf_nome?: string;
  nome_unidade?: string;
  municipio_nome?: string;
  codigo_ibge?: string;
  codigo_unidade?: string;
}

interface Filters {
  search: string;
  uf: string;
  status: string;
  valorMin: string;
  valorMax: string;
}

const SearchPage: React.FC = () => {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([]);
  const [filteredLicitacoes, setFilteredLicitacoes] = useState<Licitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados dos filtros
  const [filters, setFilters] = useState<Filters>({
    search: '',
    uf: '',
    status: '',
    valorMin: '',
    valorMax: ''
  });

  // Lista de UFs para o filtro
  const ufs = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Carregar licitações
  useEffect(() => {
    const fetchLicitacoes = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5002/api/bids/');
        const data = await response.json();
        
        if (data.success) {
          setLicitacoes(data.data);
          setFilteredLicitacoes(data.data);
        } else {
          setError(data.message || 'Erro ao carregar licitações');
        }
      } catch (err) {
        setError('Erro ao conectar com a API');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLicitacoes();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...licitacoes];

    // Filtro por texto (busca no objeto da licitação)
    if (filters.search) {
      filtered = filtered.filter(licitacao =>
        licitacao.objeto_compra?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Filtro por UF
    if (filters.uf) {
      filtered = filtered.filter(licitacao => licitacao.uf === filters.uf);
    }

    // Filtro por status calculado
    if (filters.status) {
      filtered = filtered.filter(licitacao => {
        const status = getStatusLicitacao(licitacao);
        return status.toLowerCase() === filters.status.toLowerCase();
      });
    }

    // Filtro por valor
    if (filters.valorMin) {
      const min = parseFloat(filters.valorMin);
      filtered = filtered.filter(licitacao => licitacao.valor_total_estimado >= min);
    }

    if (filters.valorMax) {
      const max = parseFloat(filters.valorMax);
      filtered = filtered.filter(licitacao => licitacao.valor_total_estimado <= max);
    }

    setFilteredLicitacoes(filtered);
  }, [filters, licitacoes]);

  // Função para determinar status baseado na data (usando status calculado do backend)
  const getStatusLicitacao = (licitacao: Licitacao) => {
    // Usar o status calculado do backend se disponível
    if (licitacao.status_calculado) {
      return licitacao.status_calculado;
    }
    
    // Fallback para cálculo frontend se necessário
    if (!licitacao.data_encerramento_proposta) return 'Indefinido';
    
    const hoje = new Date();
    const dataEncerramentoDate = new Date(licitacao.data_encerramento_proposta);
    
    // Um dia antes
    const umDiaAntes = new Date(dataEncerramentoDate);
    umDiaAntes.setDate(umDiaAntes.getDate() - 1);
    
    if (hoje > umDiaAntes) {
      return 'Fechada';
    } else {
      return 'Ativa';
    }
  };

  // Função para formatar valor (usando valor formatado do backend)
  const formatarValor = (licitacao: Licitacao) => {
    // Usar valor display do backend se disponível
    if (licitacao.valor_display !== undefined) {
      if (licitacao.valor_display === 'Sigiloso') {
        return 'Sigiloso';
      }
      if (typeof licitacao.valor_display === 'number') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(licitacao.valor_display);
      }
    }
    
    // Fallback para valor original
    if (!licitacao.valor_total_estimado || licitacao.valor_total_estimado === 0) return 'Sigiloso';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(licitacao.valor_total_estimado);
  };

  // Função auxiliar para formatar valores numéricos simples (para itens)
  const formatarValorNumerico = (valor: number) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Função para formatar data
  const formatarData = (data: string | null) => {
    if (!data) return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Abrir modal com detalhes
  const abrirModal = async (licitacao: Licitacao) => {
    setSelectedLicitacao(licitacao);
    setModalLoading(true);

    try {
      // Buscar detalhes completos
      const [detailsResponse, itemsResponse] = await Promise.all([
        fetch(`http://localhost:5002/api/bids/detail?pncp_id=${licitacao.pncp_id}`),
        fetch(`http://localhost:5002/api/bids/items?pncp_id=${licitacao.pncp_id}`)
      ]);

      const detailsData = await detailsResponse.json();
      const itemsData = await itemsResponse.json();

      if (detailsData.success) {
        const licitacaoCompleta = {
          ...detailsData.data,
          itens: itemsData.success ? itemsData.data : []
        };
        setSelectedLicitacao(licitacaoCompleta);
      }
    } catch (err) {
      console.error('Erro ao buscar detalhes:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Atualizar filtro
  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      uf: '',
      status: '',
      valorMin: '',
      valorMax: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando licitações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Licitações
              </h1>
              <p className="text-gray-600 mt-1">
                {filteredLicitacoes.length} licitações encontradas
              </p>
            </div>

            {/* Barra de busca e filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por objeto..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-full sm:w-80"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filtros
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <select
                    value={filters.uf}
                    onChange={(e) => updateFilter('uf', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Todos os estados</option>
                    {ufs.map(uf => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Todos os status</option>
                    <option value="ativa">Ativa</option>
                    <option value="fechada">Fechada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.valorMin}
                    onChange={(e) => updateFilter('valorMin', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
                  <input
                    type="number"
                    placeholder="Sem limite"
                    value={filters.valorMax}
                    onChange={(e) => updateFilter('valorMax', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid de licitações */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLicitacoes.map((licitacao) => {
            const status = getStatusLicitacao(licitacao);
            const isAtiva = status === 'Ativa';
            
            return (
              <div
                key={licitacao.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => abrirModal(licitacao)}
              >
                <div className="p-6">
                  {/* Status badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isAtiva
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {status}
                    </span>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  {/* Título (objeto) */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                    {licitacao.objeto_compra}
                  </h3>

                  {/* Informações principais */}
                  <div className="space-y-2">
                    {/* UF */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{licitacao.uf || 'Não informado'}</span>
                    </div>

                    {/* Data de encerramento */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        Encerra: {formatarData(licitacao.data_encerramento_proposta)}
                      </span>
                    </div>

                    {/* Valor */}
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">
                        {formatarValor(licitacao)}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé do card */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 truncate">
                        {licitacao.pncp_id}
                      </span>
                      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sem resultados */}
        {filteredLicitacoes.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma licitação encontrada
            </h3>
            <p className="text-gray-500">
              Tente ajustar os filtros ou a busca para encontrar licitações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      {selectedLicitacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                Detalhes da Licitação
              </h2>
              <button
                onClick={() => setSelectedLicitacao(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6">
              {modalLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando detalhes...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Informações básicas */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Informações Gerais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">PNCP ID</label>
                        <p className="text-sm text-gray-900">{selectedLicitacao.pncp_id}</p>
                      </div>
                      <div>
                                        <label className="block text-sm font-medium text-gray-700">Órgão Licitante</label>
                <div className="text-sm text-gray-900 space-y-1">
                  <p className="font-medium">{selectedLicitacao.nome_unidade || selectedLicitacao.razao_social || 'Não informado'}</p>
                  {selectedLicitacao.municipio_nome && selectedLicitacao.uf_nome && (
                    <p className="text-xs text-gray-600">📍 {selectedLicitacao.municipio_nome} - {selectedLicitacao.uf_nome}</p>
                  )}
                </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Publicação</label>
                        <p className="text-sm text-gray-900">{formatarData(selectedLicitacao.data_publicacao)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Encerramento</label>
                        <p className="text-sm text-gray-900">{formatarData(selectedLicitacao.data_encerramento_proposta)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Valor Total</label>
                        <p className="text-sm text-gray-900 font-medium">{formatarValor(selectedLicitacao)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <div className="space-y-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              getStatusLicitacao(selectedLicitacao) === 'Ativa'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {getStatusLicitacao(selectedLicitacao)}
                          </span>
                          
                          {/* Botão Analisar Licitação */}
                          
                        </div>
                        <button
                            onClick={() => {
                              const url = `/analise-licitacao?pncp_id=${encodeURIComponent(selectedLicitacao.pncp_id)}&licitacao_id=${encodeURIComponent(selectedLicitacao.id)}`;
                              window.location.href = url;
                            }}
                            className="inline-flex items-center mt-4 px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            IA Análise
                          </button>
                      </div>
                    </div>
                  </div>

                  {/* Objeto */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Objeto</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedLicitacao.objeto_compra}</p>
                  </div>

                  {/* Informações complementares */}
                  {selectedLicitacao.informacao_complementar && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Informações Complementares</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedLicitacao.informacao_complementar}</p>
                    </div>
                  )}

                  {/* Itens */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Itens da Licitação ({selectedLicitacao.itens?.length || 0})
                    </h3>
                    
                    {selectedLicitacao.itens && selectedLicitacao.itens.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidade</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Unit.</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedLicitacao.itens.map((item, index) => {
                              const valorUnitario = parseFloat(item.valor_unitario_estimado) || 0;
                              const quantidade = parseFloat(item.quantidade) || 0;
                              const valorTotal = valorUnitario * quantidade;
                              
                              return (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.numero_item}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{item.descricao}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{quantidade}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{item.unidade_medida}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{formatarValorNumerico(valorUnitario)}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatarValorNumerico(valorTotal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhum item encontrado para esta licitação</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage; 