import { useState } from 'react';

interface ConfigActionsResult {
  success: boolean;
  message: string;
}

interface ConfigActionsHook {
  startDailyBidsSearch: () => Promise<ConfigActionsResult>;
  startReevaluateBids: () => Promise<ConfigActionsResult>;
  loading: {
    dailyBids: boolean;
    reevaluate: boolean;
  };
}

import { config } from '../config/environment';

const API_BASE_URL = config.API_BASE_URL;

export const useConfigActions = (): ConfigActionsHook => {
  const [loading, setLoading] = useState({
    dailyBids: false,
    reevaluate: false
  });

  const startDailyBidsSearch = async (): Promise<ConfigActionsResult> => {
    try {
      setLoading(prev => ({ ...prev, dailyBids: true }));
      
      const response = await fetch(`${API_BASE_URL}/search-new-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        return {
          success: true,
          message: result.data?.message || 'Busca de licitações iniciada com sucesso'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Erro ao iniciar busca de licitações'
        };
      }
    } catch (error) {
      console.error('Erro ao iniciar busca:', error);
      return {
        success: false,
        message: 'Erro de conexão ao iniciar busca'
      };
    } finally {
      setLoading(prev => ({ ...prev, dailyBids: false }));
    }
  };

  const startReevaluateBids = async (): Promise<ConfigActionsResult> => {
    try {
      setLoading(prev => ({ ...prev, reevaluate: true }));
      
      const response = await fetch(`${API_BASE_URL}/reevaluate-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (response.ok && result.status === 'success') {
        return {
          success: true,
          message: result.data?.message || 'Reavaliação de licitações iniciada com sucesso'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Erro ao iniciar reavaliação de licitações'
        };
      }
    } catch (error) {
      console.error('Erro ao iniciar reavaliação:', error);
      return {
        success: false,
        message: 'Erro de conexão ao iniciar reavaliação'
      };
    } finally {
      setLoading(prev => ({ ...prev, reevaluate: false }));
    }
  };

  return {
    startDailyBidsSearch,
    startReevaluateBids,
    loading
  };
}; 