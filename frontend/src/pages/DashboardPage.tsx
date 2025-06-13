import React, { useEffect } from 'react';
import { TrendingUp, Users, FileText, Target, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useApiData } from '../hooks/useApiData';

const DashboardPage: React.FC = () => {
  const {
    bids,
    companies,
    matches,
    loading,
    loadBids,
    loadCompanies,
    loadMatches
  } = useApiData();

  useEffect(() => {
    // Carregar dados ao entrar no dashboard
    loadBids();
    loadCompanies();
    loadMatches();
  }, [loadBids, loadCompanies, loadMatches]);

  // Função para refresh manual de todos os dados
  const handleRefreshData = async () => {
    console.log('🔄 Atualizando todos os dados...');
    await Promise.all([
      loadBids(),
      loadCompanies(),
      loadMatches()
    ]);
    console.log('✅ Dados atualizados');
  };

  // Calcular estatísticas
  const totalBids = bids?.length || 0;
  const totalCompanies = companies?.length || 0;
  const totalMatches = matches?.length || 0;
  const recentMatches = matches?.slice(0, 5) || [];

  // Calcular valor total das licitações
  const totalValue = bids?.reduce((sum, bid) => sum + (bid.valor_total_estimado || 0), 0) || 0;

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema de matching de licitações</p>
        </div>
        
        <button
          onClick={handleRefreshData}
          disabled={loading.bids || loading.companies || loading.matches}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${(loading.bids || loading.companies || loading.matches) ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total de Licitações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Licitações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBids.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Licitações no sistema
            </p>
          </CardContent>
        </Card>

        {/* Total de Empresas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Cadastradas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompanies.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Empresas ativas
            </p>
          </CardContent>
        </Card>

        {/* Total de Matches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Gerados</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Compatibilidades encontradas
            </p>
          </CardContent>
        </Card>

        {/* Valor Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Em licitações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matches Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Matches Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.matches ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Carregando matches...</span>
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum match encontrado</p>
              <p className="text-sm">Execute o processo de busca para gerar matches</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMatches.map((match, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="font-medium text-gray-900">
                        {match.empresa?.nome || 'Empresa não identificada'}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        match.score >= 0.8 ? 'bg-green-100 text-green-800' :
                        match.score >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(match.score * 100)}% match
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {match.licitacao?.objeto_compra || 'Objeto não informado'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Valor: {formatCurrency(match.licitacao?.valor_total_estimado || 0)} | 
                      Data: {match.timestamp ? formatDate(match.timestamp) : 'Data não informada'}
                    </div>
                  </div>
                </div>
              ))}
              
              {matches && matches.length > 5 && (
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando 5 de {matches.length.toLocaleString('pt-BR')} matches totais
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage; 