import React from 'react';
import { X, FileText } from 'lucide-react';
import { Licitacao } from '../types/licitacao';

interface LicitacaoModalProps {
  selectedLicitacao: Licitacao | null;
  modalLoading: boolean;
  onClose: () => void;
  showAnaliseButton?: boolean;
}

const LicitacaoModal: React.FC<LicitacaoModalProps> = ({
  selectedLicitacao,
  modalLoading,
  onClose,
  showAnaliseButton = true
}) => {
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

  if (!selectedLicitacao) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header do modal */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Detalhes da Licitação
          </h2>
          <button
            onClick={onClose}
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
                      <div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusLicitacao(selectedLicitacao) === 'Ativa'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getStatusLicitacao(selectedLicitacao)}
                        </span>
                      </div>
                      
                      {/* Botão Analisar Licitação */}
                      {showAnaliseButton && (
                        <div>
                          <button
                            onClick={() => {
                              const url = `/analise-licitacao?pncp_id=${encodeURIComponent(selectedLicitacao.pncp_id)}&licitacao_id=${encodeURIComponent(selectedLicitacao.id)}`;
                              window.location.href = url;
                            }}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 shadow-sm"
                          >
                            <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            IA Análise
                          </button>
                        </div>
                      )}
                    </div>
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
  );
};

export default LicitacaoModal; 