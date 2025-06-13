import React from 'react';
import { Target, Award, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Match } from '../../types';
import { formatCurrency, formatDate, getScorePercentage, getScoreColor } from '../../utils';

// Atualizado com novos campos da unidadeOrgao

interface MatchCardProps {
  match: Match;
  onBidClick?: (pncp_id: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onBidClick }) => {
  const getScoreIcon = (score: number) => {
    const percentage = getScorePercentage(score);
    if (percentage >= 80) return <Award className="h-4 w-4" />;
    if (percentage >= 60) return <TrendingUp className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  const handleBidClick = () => {
    if (onBidClick && match.licitacao?.pncp_id) {
      onBidClick(match.licitacao.pncp_id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg leading-tight pr-4">
            {match.licitacao?.objeto_compra || 'Objeto não informado'}
          </CardTitle>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score)}`}>
            {getScoreIcon(match.score)}
            {getScorePercentage(match.score)}%
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Empresa */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Empresa Compatível
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><span className="font-medium">Nome:</span> {match.empresa?.nome || 'Nome não informado'}</div>
            <div><span className="font-medium">Razão Social:</span> {match.empresa?.razao_social || 'N/A'}</div>
            <div><span className="font-medium">CNPJ:</span> {match.empresa?.cnpj || 'N/A'}</div>
            <div className="md:col-span-2"><span className="font-medium">Setor:</span> {match.empresa?.setor_atuacao || 'N/A'}</div>
          </div>
        </div>

        {/* Informações da Licitação - Clicável */}
        <div 
          className={`bg-gray-50 p-3 rounded-lg transition-all duration-200 ${
            onBidClick ? 'cursor-pointer hover:bg-gray-100 hover:shadow-sm border border-transparent hover:border-blue-200' : ''
          }`}
          onClick={handleBidClick}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              Detalhes da Licitação
              {onBidClick && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Clique para ver detalhes
                </span>
              )}
            </h4>
            {onBidClick && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div><span className="font-medium">ID PNCP:</span> {match.licitacao?.pncp_id || 'N/A'}</div>
            <div><span className="font-medium">Valor:</span> {match.licitacao?.valor_total_estimado ? formatCurrency(match.licitacao.valor_total_estimado) : 'N/A'}</div>
            <div><span className="font-medium">UF:</span> {match.licitacao?.uf || 'N/A'}</div>
            <div><span className="font-medium">Status:</span> {match.licitacao?.status || 'N/A'}</div>
            <div><span className="font-medium">Data:</span> {match.licitacao?.data_publicacao ? formatDate(match.licitacao.data_publicacao) : 'N/A'}</div>
                            <div>
                  <span className="font-medium">Órgão Licitante:</span> 
                  <div className="ml-2">
                    <div>{(match.licitacao as any)?.nome_unidade || match.licitacao?.razao_social || 'N/A'}</div>
                    {(match.licitacao as any)?.municipio_nome && (match.licitacao as any)?.uf_nome && (
                      <div className="text-xs text-gray-600">📍 {(match.licitacao as any).municipio_nome} - {(match.licitacao as any).uf_nome}</div>
                    )}
                  </div>
                </div>
          </div>
        </div>

        {/* Informações do Match */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Tipo de Match:</span> {match.tipo_match}
          </div>
          <div className="text-sm text-gray-500">
            Match realizado em: {formatDate(match.timestamp)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard; 