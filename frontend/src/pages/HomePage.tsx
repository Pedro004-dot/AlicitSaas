import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Link, 
  Building2, 
  Clock,
  ArrowRight,
  Calendar,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useApiData } from '../hooks/useApiData';
import { Match, Bid } from '../types';
import { config } from '../config/environment';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  onClick?: () => void;
}

interface RecentMatch extends Match {
  licitacao?: Bid;
  empresa?: {
    id: string;
    nome: string;
    razao_social?: string;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  loading,
  onClick 
}) => (
  <div 
    className={`
      bg-white rounded-xl shadow-sm border border-gray-200 p-6 
      transition-all duration-200 hover:shadow-md hover:-translate-y-1
      ${onClick ? 'cursor-pointer' : ''}
    `}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center space-x-2 text-gray-600 text-sm mb-1">
          <Icon className="w-4 h-4" />
          <span>{title}</span>
        </div>
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
        ) : (
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        )}
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-[#FF7610] to-orange-600 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

interface HomePageProps {
  onPageChange?: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onPageChange }) => {
  const { matches, companies, loading } = useApiData();
  
  // Estados para métricas
  const [activeBids, setActiveBids] = useState<number>(0);
  const [loadingActiveBids, setLoadingActiveBids] = useState(true);
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [loadingRecentMatches, setLoadingRecentMatches] = useState(true);

  // Buscar licitações ativas
  useEffect(() => {
    const fetchActiveBids = async () => {
      try {
        setLoadingActiveBids(true);
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${config.API_BASE_URL}/bids/active?after=${today}`);
        const result = await response.json();
        
        if (result.success) {
          setActiveBids(result.total || result.data?.length || 0);
        }
      } catch (error) {
        console.error('Erro ao buscar licitações ativas:', error);
        setActiveBids(0);
      } finally {
        setLoadingActiveBids(false);
      }
    };

    fetchActiveBids();
  }, []);

  // Buscar matches recentes
  useEffect(() => {
    const fetchRecentMatches = async () => {
      try {
        setLoadingRecentMatches(true);
        const response = await fetch(`${config.API_BASE_URL}/matches/recent?limit=5`);
        const result = await response.json();
        
        if (result.success) {
          setRecentMatches(result.data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar matches recentes:', error);
        setRecentMatches([]);
      } finally {
        setLoadingRecentMatches(false);
      }
    };

    fetchRecentMatches();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo a Alicit! 
            </h1>
            <p className="text-gray-600">
              Acompanhe suas métricas de licitações, matches e empresas em tempo real.
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Licitações Ativas"
              value={activeBids}
              subtitle="Em andamento hoje"
              icon={FileText}
              loading={loadingActiveBids}
              onClick={() => onPageChange?.('licitacoes')}
            />
            
            <MetricCard
              title="Total de Matches"
              value={matches.length}
              subtitle="Correspondências encontradas"
              icon={Link}
              loading={loading.matches}
              onClick={() => onPageChange?.('matches')}
            />
            
            <MetricCard
              title="Empresas Cadastradas"
              value={companies.length}
              subtitle="No banco de dados"
              icon={Building2}
              loading={loading.companies}
              onClick={() => onPageChange?.('empresas')}
            />
          </div>

          {/* Card de Matches Recentes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-[#FF7610]" />
                    <span>Matches Recentes</span>
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Últimas correspondências entre empresas e licitações
                  </p>
                </div>
                <button 
                  onClick={() => onPageChange?.('matches')}
                  className="flex items-center space-x-1 text-[#FF7610] hover:text-orange-700 text-sm font-medium transition-colors"
                >
                  <span>Ver todos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingRecentMatches ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentMatches.length > 0 ? (
                <div className="space-y-4">
                  {recentMatches.map((match, index) => (
                    <div key={match.id} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                      {/* Score Badge */}
                      <div className="w-12 h-12 bg-gradient-to-br from-[#FF7610] to-orange-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {Math.round(match.score * 100)}%
                        </span>
                      </div>

                      {/* Informações do Match */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {match.empresa?.nome || 'Empresa não encontrada'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {match.licitacao?.objeto_compra || 'Licitação não encontrada'}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(match.timestamp)}</span>
                              </div>
                              {match.licitacao?.uf && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{match.licitacao.uf}</span>
                                </div>
                              )}
                              {match.licitacao?.valor_total_estimado && (
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="w-3 h-3" />
                                  <span>{formatCurrency(match.licitacao.valor_total_estimado)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Match */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {match.tipo_match}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum match recente
                  </h3>
                  <p className="text-gray-600">
                    Os matches aparecerão aqui quando forem encontrados.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HomePage; 