import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface StatusData {
  running: boolean;
  status: string;
  message: string;
  last_run: string | null;
}

const StatusDebug: React.FC = () => {
  const [searchStatus, setSearchStatus] = useState<StatusData | null>(null);
  const [reevalStatus, setReevalStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [searchRes, reevalRes] = await Promise.all([
        fetch('http://localhost:5002/api/status/daily-bids'),
        fetch('http://localhost:5002/api/status/reevaluate')
      ]);

      const searchData = await searchRes.json();
      const reevalData = await reevalRes.json();

      console.log('Status Debug - Search:', searchData);
      console.log('Status Debug - Reeval:', reevalData);

      if (searchData.status === 'success') {
        setSearchStatus(searchData.data);
      }
      if (reevalData.status === 'success') {
        setReevalStatus(reevalData.data);
      }
    } catch (err) {
      console.error('Erro ao buscar status:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg border p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">Debug - Status dos Processos</h3>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      <div className="space-y-3">
        {/* Status da Busca */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="font-medium text-gray-700">Busca Diária:</div>
          {searchStatus ? (
            <div className="mt-1">
              <div>Running: <span className={searchStatus.running ? 'text-red-600' : 'text-green-600'}>
                {searchStatus.running ? 'true' : 'false'}
              </span></div>
              <div>Status: <span className="text-blue-600">{searchStatus.status}</span></div>
              <div>Message: <span className="text-gray-600">{searchStatus.message || 'Nenhuma'}</span></div>
              <div>Last Run: <span className="text-gray-600">{searchStatus.last_run || 'Nunca'}</span></div>
            </div>
          ) : (
            <div className="text-gray-500">Carregando...</div>
          )}
        </div>

        {/* Status da Reavaliação */}
        <div className="bg-gray-50 p-2 rounded text-xs">
          <div className="font-medium text-gray-700">Reavaliação:</div>
          {reevalStatus ? (
            <div className="mt-1">
              <div>Running: <span className={reevalStatus.running ? 'text-red-600' : 'text-green-600'}>
                {reevalStatus.running ? 'true' : 'false'}
              </span></div>
              <div>Status: <span className="text-blue-600">{reevalStatus.status}</span></div>
              <div>Message: <span className="text-gray-600">{reevalStatus.message || 'Nenhuma'}</span></div>
              <div>Last Run: <span className="text-gray-600">{reevalStatus.last_run || 'Nunca'}</span></div>
            </div>
          ) : (
            <div className="text-gray-500">Carregando...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusDebug; 