import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock, Calendar, Play, Square } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Status } from '../types';

interface StatusCardsProps {
  status: {
    daily_bids: Status;
    reevaluate: Status;
  } | null;
}

const StatusCards: React.FC<StatusCardsProps> = ({ status }) => {
  const getStatusIcon = (processStatus: Status) => {
    if (processStatus.running) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
    if (processStatus.last_result?.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (processStatus.last_result?.success === false) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    return <Clock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusColor = (processStatus: Status) => {
    if (processStatus.running) return 'border-blue-200 bg-blue-50';
    if (processStatus.last_result?.success) return 'border-green-200 bg-green-50';
    if (processStatus.last_result?.success === false) return 'border-red-200 bg-red-50';
    return 'border-gray-200 bg-gray-50';
  };

  const getStatusText = (processStatus: Status) => {
    if (processStatus.running) return 'Em execução';
    if (processStatus.last_result?.success) return 'Concluído com sucesso';
    if (processStatus.last_result?.success === false) return 'Erro na execução';
    return 'Aguardando execução';
  };

  const getStatusBadge = (processStatus: Status) => {
    if (processStatus.running) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Play className="h-3 w-3 mr-1" />
        Executando
      </span>;
    }
    
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      <Square className="h-3 w-3 mr-1" />
      Parado
    </span>;
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Nunca executado';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
    }
  };

  const getProcessDescription = (type: 'daily' | 'reevaluate') => {
    if (type === 'daily') {
      return 'Busca novas licitações na API do PNCP e faz matching automático com empresas cadastradas';
    }
    return 'Reavalia licitações existentes no banco de dados para encontrar novos matches';
  };

  const getEstimatedTime = (processStatus: Status, type: 'daily' | 'reevaluate') => {
    if (!processStatus.running) return null;
    
    return type === 'daily' ? '5-15 minutos' : '10-30 minutos';
  };

  if (!status) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Busca de Novas Licitações */}
      <Card className={`border-2 transition-all duration-200 ${getStatusColor(status.daily_bids)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.daily_bids)}
              <span className="text-lg">🔍 Busca de Licitações</span>
            </div>
            {getStatusBadge(status.daily_bids)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Status: {getStatusText(status.daily_bids)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getProcessDescription('daily')}
              </p>
            </div>
            
            {/* {status.daily_bids.message && (
              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-700">{status.daily_bids.message}</p>
              </div>
            )} */}
            
            {status.daily_bids.running && getEstimatedTime(status.daily_bids, 'daily') && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Clock className="h-4 w-4" />
                <span>Tempo estimado: {getEstimatedTime(status.daily_bids, 'daily')}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Última execução: {formatTimestamp(status.daily_bids.last_result?.timestamp)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reavaliação de Licitações */}
      <Card className={`border-2 transition-all duration-200 ${getStatusColor(status.reevaluate)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(status.reevaluate)}
              <span className="text-lg">🔄 Reavaliação</span>
            </div>
            {getStatusBadge(status.reevaluate)}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Status: {getStatusText(status.reevaluate)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {getProcessDescription('reevaluate')}
              </p>
            </div>
            
            {/* {status.reevaluate.message && (
              <div className="bg-white/60 rounded-lg p-3 border border-gray-200">
                <p className="text-sm text-gray-700">{status.reevaluate.message}</p>
              </div>
            )} */}
            
            {status.reevaluate.running && getEstimatedTime(status.reevaluate, 'reevaluate') && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Clock className="h-4 w-4" />
                <span>Tempo estimado: {getEstimatedTime(status.reevaluate, 'reevaluate')}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Última execução: {formatTimestamp(status.reevaluate.last_result?.timestamp)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusCards; 