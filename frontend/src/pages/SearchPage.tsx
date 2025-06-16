import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, DollarSign, FileText, Eye, ChevronDown } from 'lucide-react';
import { config } from '../config/environment';
import LicitacaoModal from '../components/LicitacaoModal';
import { Licitacao } from '../types/licitacao';

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
        const response = await fetch(`${config.API_BASE_URL}/bids/`);
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
        fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${licitacao.pncp_id}`),
        fetch(`${config.API_BASE_URL}/bids/items?pncp_id=${licitacao.pncp_id}`)
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
      <LicitacaoModal
        selectedLicitacao={selectedLicitacao}
        modalLoading={modalLoading}
        onClose={() => setSelectedLicitacao(null)}
        showAnaliseButton={true}
      />
    </div>
  );
};

export default SearchPage; 