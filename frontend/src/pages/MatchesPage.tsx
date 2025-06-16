import React, { useState, useEffect } from 'react';
import { Building, FileText, Eye, X, MapPin, DollarSign, ArrowLeft, Users, Award, Target, Search, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { config } from '../config/environment';
import LicitacaoModal from '../components/LicitacaoModal';
import { Licitacao } from '../types/licitacao';

interface EmpresaMatch {
  empresa_id: string;
  empresa_nome: string;
  razao_social: string;
  cnpj: string;
  setor_atuacao: string;
  total_matches: number;
  score_medio: string;
  melhor_score: string;
  pior_score: string;
}

interface Match {
  id: string;
  score_similaridade: string;
  match_type: string;
  justificativa_match: string;
  data_match: string;
  // Dados da licitação no match
  licitacao_id: string;
  licitacao_pncp_id?: string; // O PNCP ID pode estar em um campo separado
  licitacao_objeto: string;
  licitacao_uf: string | null;
  licitacao_valor: string;
  licitacao_data_publicacao: string | null;
  licitacao_modalidade: string | null;
}

const MatchesPage: React.FC = () => {
  const [empresas, setEmpresas] = useState<EmpresaMatch[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaMatch | null>(null);
  const [matchesEmpresa, setMatchesEmpresa] = useState<Match[]>([]);
  const [selectedLicitacao, setSelectedLicitacao] = useState<Licitacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para os botões de match
  const [searchingNewBids, setSearchingNewBids] = useState(false);
  const [reevaluatingBids, setReevaluatingBids] = useState(false);


  const [processStatus, setProcessStatus] = useState<{
    search: { running: boolean; message: string; };
    reevaluate: { running: boolean; message: string; };
  }>({
    search: { running: false, message: '' },
    reevaluate: { running: false, message: '' }
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    visible: boolean;
  }>({ type: 'info', message: '', visible: false });

  // Função para mostrar notificação
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Polling de status dos processos
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (searchingNewBids || reevaluatingBids) {
      console.log('Iniciando polling de status...', { searchingNewBids, reevaluatingBids });
      
      interval = setInterval(async () => {
        try {
          // Verificar status da busca
          if (searchingNewBids) {
            console.log('Verificando status da busca...');
            const searchResponse = await fetch(`${config.API_BASE_URL}/status/daily-bids`);
            const searchData = await searchResponse.json();
            
            console.log('Status da busca:', searchData);
            
            if (searchData.status === 'success' && searchData.data) {
              const isRunning = searchData.data.running === true;
              const message = searchData.data.message || '';
              
              setProcessStatus(prev => ({
                ...prev,
                search: {
                  running: isRunning,
                  message: message
                }
              }));
              
              // Se não está mais rodando, finalizar
              if (!isRunning && searchingNewBids) {
                console.log('Busca concluída, finalizando...');
                setSearchingNewBids(false);
                showNotification('success', 'Busca de novas licitações concluída! Recarregando dados...');
                // Recarregar dados após 2 segundos
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }
          }
          
          // Verificar status da reavaliação
          if (reevaluatingBids) {
            console.log('Verificando status da reavaliação...');
            const reevalResponse = await fetch(`${config.API_BASE_URL}/status/reevaluate`);
            const reevalData = await reevalResponse.json();
            
            console.log('Status da reavaliação:', reevalData);
            
            if (reevalData.status === 'success' && reevalData.data) {
              const isRunning = reevalData.data.running === true;
              const message = reevalData.data.message || '';
              
              setProcessStatus(prev => ({
                ...prev,
                reevaluate: {
                  running: isRunning,
                  message: message
                }
              }));
              
              // Se não está mais rodando, finalizar
              if (!isRunning && reevaluatingBids) {
                console.log('Reavaliação concluída, finalizando...');
                setReevaluatingBids(false);
                showNotification('success', 'Reavaliação de matches concluída! Recarregando dados...');
                // Recarregar dados após 2 segundos
                setTimeout(() => {
                  window.location.reload();
                }, 2000);
              }
            }
          }
          
        } catch (err) {
          console.error('Erro ao verificar status dos processos:', err);
          // Em caso de erro, parar os processos para evitar loop infinito
          if (searchingNewBids) {
            setSearchingNewBids(false);
            showNotification('error', 'Erro ao verificar status da busca');
          }
          if (reevaluatingBids) {
            setReevaluatingBids(false);
            showNotification('error', 'Erro ao verificar status da reavaliação');
          }
        }
      }, 2000); // Reduzir para 2 segundos para ser mais responsivo
    }
    
    return () => {
      if (interval) {
        console.log('Limpando interval de polling');
        clearInterval(interval);
      }
    };
  }, [searchingNewBids, reevaluatingBids]);

  // Função para buscar novas licitações
  const handleSearchNewBids = async () => {
    if (searchingNewBids || reevaluatingBids) {
      console.log('Processo já em andamento, ignorando clique');
      return;
    }

    try {
      console.log('Iniciando busca de novas licitações...');
      setSearchingNewBids(true);
      setProcessStatus(prev => ({
        ...prev,
        search: { running: true, message: 'Iniciando busca de novas licitações...' }
      }));
      
      const response = await fetch(`${config.API_BASE_URL}/search-new-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      console.log('Resposta da API de busca:', data);
      
      if (data.status === 'success' && data.data.success) {
        showNotification('info', `Busca iniciada! ${data.data.estimated_duration || 'Processo em andamento...'}`);
      } else {
        throw new Error(data.data?.message || data.message || 'Erro ao iniciar busca');
      }
      
    } catch (err) {
      console.error('Erro ao iniciar busca:', err);
      setSearchingNewBids(false);
      setProcessStatus(prev => ({
        ...prev,
        search: { running: false, message: '' }
      }));
      showNotification('error', err instanceof Error ? err.message : 'Erro ao iniciar busca de licitações');
    }
  };

  // Função para reavaliar matches
  const handleReevaluateBids = async () => {
    if (reevaluatingBids || searchingNewBids) {
      console.log('Processo já em andamento, ignorando clique');
      return;
    }

    try {
      console.log('Iniciando reavaliação de matches...');
      setReevaluatingBids(true);
      setProcessStatus(prev => ({
        ...prev,
        reevaluate: { running: true, message: 'Iniciando reavaliação de matches...' }
      }));
      
      const response = await fetch(`${config.API_BASE_URL}/reevaluate-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      console.log('Resposta da API de reavaliação:', data);
      
      if (data.status === 'success' && data.data.success) {
        showNotification('info', `Reavaliação iniciada! ${data.data.estimated_duration || 'Processo em andamento...'}`);
      } else {
        throw new Error(data.data?.message || data.message || 'Erro ao iniciar reavaliação');
      }
      
    } catch (err) {
      console.error('Erro ao iniciar reavaliação:', err);
      setReevaluatingBids(false);
      setProcessStatus(prev => ({
        ...prev,
        reevaluate: { running: false, message: '' }
      }));
      showNotification('error', err instanceof Error ? err.message : 'Erro ao iniciar reavaliação de matches');
    }
  };

  // Função para parar processo manualmente
  const handleStopProcess = () => {
    console.log('Parando processos manualmente...');
    if (searchingNewBids) {
      setSearchingNewBids(false);
      showNotification('info', 'Busca de licitações interrompida pelo usuário');
    }
    if (reevaluatingBids) {
      setReevaluatingBids(false);
      showNotification('info', 'Reavaliação de matches interrompida pelo usuário');
    }
    setProcessStatus({
      search: { running: false, message: '' },
      reevaluate: { running: false, message: '' }
    });
  };

  // Carregar empresas com matches
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${config.API_BASE_URL}/matches/by-company`);
        const data = await response.json();
        
        if (data.success) {
          setEmpresas(data.data);
        } else {
          setError(data.message || 'Erro ao carregar empresas');
        }
      } catch (err) {
        setError('Erro ao conectar com a API');
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresas();
  }, []);

  // Função para buscar matches de uma empresa específica
  const buscarMatchesEmpresa = async (empresa: EmpresaMatch) => {
    try {
      setSelectedEmpresa(empresa);
      setLoading(true);
      
      // Por enquanto vamos buscar todos os matches e filtrar no frontend
      // TODO: Implementar filtro por empresa no backend
      const response = await fetch(`${config.API_BASE_URL}/matches/`);
      const data = await response.json();
      
      if (data.success) {
        // Filtrar matches da empresa selecionada
        const matchesFiltered = data.data.filter((match: any) => 
          match.empresa_id === empresa.empresa_id
        );
        
        setMatchesEmpresa(matchesFiltered);
      } else {
        setError(data.message || 'Erro ao carregar matches');
      }
    } catch (err) {
      setError('Erro ao conectar com a API');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  // Voltar para a lista de empresas
  const voltarParaEmpresas = () => {
    setSelectedEmpresa(null);
    setMatchesEmpresa([]);
  };

  // Funções auxiliares necessárias para a página
  const formatarValorNumerico = (valor: number) => {
    if (!valor || valor === 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string | null) => {
    if (!data) return 'Não informado';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const formatarScore = (score: string) => {
    return `${(parseFloat(score) * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score) * 100;
    if (numScore >= 80) return 'text-green-600 bg-green-50';
    if (numScore >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMatchTypeLabel = (type: string) => {
    const tipos = {
      'objeto_completo': 'Objeto Completo',
      'item_especifico': 'Item Específico',
      'objeto_e_itens': 'Objeto + Itens'
    };
    return tipos[type as keyof typeof tipos] || type;
  };

  // Abrir modal com detalhes da licitação (seguindo padrão do SearchPage)
  const abrirModal = async (match: Match) => {
    // Primeiro criar um objeto básico e definir no estado (para o modal abrir)
    const licitacaoBasica: Licitacao = {
      id: match.licitacao_id,
      pncp_id: match.licitacao_pncp_id || match.licitacao_id,
      objeto_compra: match.licitacao_objeto,
      uf: match.licitacao_uf || '',
      data_encerramento_proposta: null,
      valor_total_estimado: parseFloat(match.licitacao_valor) || 0,
      status: 'Ativa',
      data_publicacao: match.licitacao_data_publicacao,
      modalidade_nome: match.licitacao_modalidade || '',
      situacao_compra_nome: '',
      processo: '',
      orgao_entidade: null,
      unidade_orgao: null,
      informacao_complementar: 'Dados básicos da licitação obtidos através do match.',
      itens: []
    };

    setSelectedLicitacao(licitacaoBasica);
    setModalLoading(true);

    try {
      // Primeiro buscar o pncp_id correto usando o licitacao_id
      const bidResponse = await fetch(`${config.API_BASE_URL}/bids/`);
      const bidData = await bidResponse.json();
      
      let realPncpId = match.licitacao_pncp_id || match.licitacao_id;
      
      if (bidData.success) {
        const licitacao = bidData.data.find((l: any) => l.id === match.licitacao_id);
        if (licitacao && licitacao.pncp_id) {
          realPncpId = licitacao.pncp_id;
        }
      }

      // Agora tentar buscar detalhes completos com o pncp_id correto
      const [detailsResponse, itemsResponse] = await Promise.all([
        fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${encodeURIComponent(realPncpId)}`),
        fetch(`${config.API_BASE_URL}/bids/items?pncp_id=${encodeURIComponent(realPncpId)}`)
      ]);

      const detailsData = await detailsResponse.json();
      const itemsData = await itemsResponse.json();

      if (detailsResponse.ok && detailsData.success) {
        // Se conseguiu buscar detalhes completos, atualizar com dados da API
        const licitacaoCompleta = {
          ...detailsData.data,
          itens: itemsData.success ? itemsData.data : []
        };
        setSelectedLicitacao(licitacaoCompleta);
      }
      // Se não conseguiu buscar da API, mantém os dados básicos que já foram definidos
    } catch (err) {
      // Em caso de erro, mantém os dados básicos que já foram definidos
      console.error('Erro ao buscar detalhes completos:', err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando matches...</p>
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
      {/* Notificação */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
          notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {notification.type === 'info' && <Clock className="h-5 w-5" />}
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(prev => ({ ...prev, visible: false }))}
              className="ml-auto text-white hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedEmpresa && (
                <button
                  onClick={voltarParaEmpresas}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Voltar
                </button>
              )}
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedEmpresa 
                    ? `Matches para ${selectedEmpresa.empresa_nome}`
                    : 'Matches por Empresa'
                  }
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedEmpresa 
                    ? `${matchesEmpresa.length} licitações encontradas`
                    : `${empresas.length} empresas com matches`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Botões de Ação */}
              <div className="flex gap-3">
                {/* Botão Buscar Novas Licitações */}
                <button
                  onClick={handleSearchNewBids}
                  disabled={searchingNewBids || reevaluatingBids}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    searchingNewBids
                      ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  } ${reevaluatingBids ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Buscar novas licitações no PNCP e gerar matches"
                >
                  {searchingNewBids ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {searchingNewBids ? 'Buscando...' : 'Buscar Novas'}
                  </span>
                </button>

                {/* Botão Reavaliar Matches */}
                <button
                  onClick={handleReevaluateBids}
                  disabled={reevaluatingBids || searchingNewBids}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    reevaluatingBids
                      ? 'bg-green-100 text-green-600 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                  } ${searchingNewBids ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title="Reavaliar licitações existentes e recalcular matches"
                >
                  {reevaluatingBids ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {reevaluatingBids ? 'Reavaliando...' : 'Reavaliar Matches'}
                  </span>
                </button>
              </div>

              {/* Status Score (apenas quando empresa selecionada) */}
              {selectedEmpresa && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Score médio</div>
                  <div className={`text-2xl font-bold ${getScoreColor(selectedEmpresa.score_medio)}`}>
                    {formatarScore(selectedEmpresa.score_medio)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status dos Processos */}
          {(searchingNewBids || reevaluatingBids) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {searchingNewBids ? 'Buscando novas licitações...' : 'Reavaliando matches...'}
                    </p>
                    <p className="text-xs text-blue-600">
                      {searchingNewBids ? processStatus.search.message : processStatus.reevaluate.message}
                    </p>
                    <p className="text-xs text-blue-500 mt-1">
                      Verificando status a cada 2 segundos...
                    </p>
                  </div>
                </div>
                
                {/* Botão para parar processo */}
                <button
                  onClick={handleStopProcess}
                  className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
                  title="Interromper processo atual"
                >
                  <div className="flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Parar
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedEmpresa ? (
          // Grid de empresas
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {empresas.map((empresa) => (
              <div
                key={empresa.empresa_id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                onClick={() => buscarMatchesEmpresa(empresa)}
              >
                <div className="p-6">
                  {/* Header do card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Building className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {empresa.empresa_nome}
                        </h3>
                        <p className="text-sm text-gray-500">{empresa.razao_social}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(empresa.score_medio)}`}>
                      {formatarScore(empresa.score_medio)}
                    </span>
                  </div>

                  {/* Informações da empresa */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{empresa.setor_atuacao}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>CNPJ: {empresa.cnpj}</span>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {empresa.total_matches}
                      </div>
                      <div className="text-xs text-gray-500">Matches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatarScore(empresa.melhor_score)}
                      </div>
                      <div className="text-xs text-gray-500">Melhor Score</div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button className="w-full text-orange-500 hover:text-orange-600 text-sm font-medium">
                      Ver matches →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Grid de licitações da empresa selecionada
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchesEmpresa.map((match) => {
              return (
                <div
                  key={match.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                  onClick={() => abrirModal(match)}
                >
                  <div className="p-6">
                    {/* Header com status e score */}
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score_similaridade)}`}>
                        Match: {formatarScore(match.score_similaridade)}
                      </span>
                      <Eye className="h-5 w-5 text-gray-400" />
                    </div>

                    {/* Título (objeto) */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                      {match.licitacao_objeto}
                    </h3>

                    {/* Informações principais */}
                    <div className="space-y-2 mb-4">
                      {/* UF */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{match.licitacao_uf || 'Não informado'}</span>
                      </div>

                      {/* Valor */}
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-medium">
                          {match.licitacao_valor && parseFloat(match.licitacao_valor) > 0 
                            ? formatarValorNumerico(parseFloat(match.licitacao_valor))
                            : 'Sigiloso'
                          }
                        </span>
                      </div>

                      {/* Tipo de match */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Award className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{getMatchTypeLabel(match.match_type)}</span>
                      </div>
                    </div>

                    {/* Justificativa */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {match.justificativa_match}
                      </p>
                    </div>

                    {/* Rodapé do card */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatarData(match.data_match)}
                      </span>
                      <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sem resultados */}
        {!selectedEmpresa && empresas.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma empresa com matches encontrada
            </h3>
            <p className="text-gray-500">
              Ainda não há matches processados no sistema.
            </p>
          </div>
        )}

        {selectedEmpresa && matchesEmpresa.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum match encontrado
            </h3>
            <p className="text-gray-500">
              Esta empresa não possui matches com licitações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de detalhes da licitação */}
      <LicitacaoModal
        selectedLicitacao={selectedLicitacao}
        modalLoading={modalLoading}
        onClose={() => setSelectedLicitacao(null)}
        showAnaliseButton={false}
      />
    </div>
  );
};

export default MatchesPage; 