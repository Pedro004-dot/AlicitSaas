import React, { useState, useEffect, useRef } from 'react';
import { BidDetail } from '../types';
import { FileText } from 'lucide-react';
import { config } from '../config/environment';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface DocFile {
  name: string;
  url: string;
  type: string; // ex: 'pdf', 'image', etc.
  size?: number;
  created_at?: string;
  updated_at?: string;
}

const BidAnalysisPage: React.FC = () => {
  // Extrair parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const pncp_id = urlParams.get('pncp_id');
  const licitacao_id = urlParams.get('licitacao_id');
  
  const [bidDetail, setBidDetail] = useState<BidDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<DocFile[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocFile | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  useEffect(() => {
    if (pncp_id) {
      fetchBidDetail();
    }
  }, [pncp_id]);

  useEffect(() => {
    // Adicionar mensagem de boas-vindas
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Olá! Sou seu assistente especializado em análise de licitações.\n\nEstou aqui para responder dúvidas específicas sobre esta licitação com base nos documentos oficiais.\n\n💡 Algumas perguntas que você pode me fazer:\n• Qual é o objeto desta licitação?\n• Qual o valor estimado?\n• Quais são os documentos necessários?\n• Quais são os prazos importantes?\n• Como posso participar desta licitação?\n• Quais são os critérios de habilitação?\n\nFique à vontade para perguntar!`,
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  useEffect(() => {
    // Scroll para a última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (licitacao_id) {
      fetchDocuments();
    }
  }, [licitacao_id]);

  const fetchBidDetail = async () => {
    if (!pncp_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/bids/detail?pncp_id=${encodeURIComponent(pncp_id)}`);
      if (!response.ok) {
        throw new Error('Falha ao carregar detalhes da licitação');
      }
      const data = await response.json();
      setBidDetail(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    setDocumentsError(null);
    
    try {
      if (!licitacao_id) {
        console.warn('⚠️ licitacao_id não disponível para buscar documentos');
        setDocumentsLoading(false);
        return;
      }
      
      console.log('🔍 Buscando documentos para licitacao_id:', licitacao_id);
      const res = await fetch(`${config.API_BASE_URL}/bids/documents?licitacao_id=${licitacao_id}`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('📄 Resposta da API de documentos:', data);
      
      if (data.success) {
        const docs = data.data || [];
        setDocuments(docs);
        console.log(`✅ ${docs.length} documentos carregados`);
        
        // Se há documentos, selecionar o primeiro automaticamente
        if (docs.length > 0) {
          setActiveDoc(docs[0]);
          console.log('📋 Documento ativo:', docs[0].name);
        }
      } else {
        console.error('❌ Erro na resposta da API:', data.message);
        setDocumentsError(data.message || 'Erro ao carregar documentos');
        setDocuments([]);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar documentos:', err);
      setDocumentsError(err instanceof Error ? err.message : 'Erro desconhecido');
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };


  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !licitacao_id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };

    setChatMessages(prev => [...prev, userMessage, loadingMessage]);
    setCurrentMessage('');
    setChatLoading(true);

    try {
      const response = await fetch(`${config.API_BASE_URL}/rag/analisarDocumentos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licitacao_id: licitacao_id,
          query: currentMessage.trim()
        })
      });
      //teste 123

      const result = await response.json();

      if (response.ok && result.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: result.answer || 'Desculpe, não consegui processar sua pergunta no momento.',
          timestamp: new Date(),
        };

        setChatMessages(prev => prev.slice(0, -1).concat(assistantMessage));
      } else {
        throw new Error(result.error || 'Erro ao processar pergunta');
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 3).toString(),
        type: 'assistant',
        content: `Desculpe, ocorreu um erro ao processar sua pergunta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
        timestamp: new Date(),
      };

      setChatMessages(prev => prev.slice(0, -1).concat(errorMessage));
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Análise Inteligente
                </h1>
              </div>
              
              {bidDetail && (
                <div className="space-y-1">
                  <p className="text-gray-600">
                    <span className="font-medium">PNCP:</span> {bidDetail.pncp_id}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Objeto:</span> {bidDetail.objeto_compra}
                  </p>
                </div>
              )}
              
              {!bidDetail && !loading && (
                <p className="text-gray-600">
                  Converse com nossa IA sobre os documentos desta licitação
                </p>
              )}
            </div>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-[35%_1fr] h-[calc(100vh-100px)] max-w-7xl mx-auto mt-8 border border-gray-200 rounded-xl overflow-hidden bg-white">
        {/* Coluna Documentos */}
        <div className="border-r flex flex-col">
          <header className="p-4 border-b flex items-center gap-2 bg-gray-50">
            <FileText className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-gray-900 text-sm">
              Documentos {documentsLoading ? '...' : `(${documents.length})`}
            </h2>
            {documentsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 ml-auto"></div>
            )}
          </header>

          {/* Lista de documentos */}
          <ul className="divide-y overflow-y-auto flex-1">
            {documentsLoading ? (
              <li className="p-4 text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                Carregando documentos...
              </li>
            ) : documentsError ? (
              <li className="p-4 text-sm text-red-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {documentsError}
              </li>
            ) : documents.length === 0 ? (
              <li className="p-4 text-sm text-gray-500 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Nenhum documento encontrado
              </li>
            ) : (
              documents.map((doc) => (
                <li
                  key={doc.url}
                  onClick={() => setActiveDoc(doc)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 transition-colors ${
                    activeDoc?.url === doc.url ? 'bg-orange-50 text-orange-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {doc.type === 'pdf' ? (
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{doc.name}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {doc.size && (
                          <span>{(doc.size / 1024 / 1024).toFixed(1)} MB</span>
                        )}
                        {doc.created_at && (
                          <span>
                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {doc.size && doc.created_at && <span>•</span>}
                        <span className="uppercase text-xs font-medium">
                          {doc.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>

          {/* Viewer */}
          <div className="h-80 border-t bg-gray-50">
            {activeDoc ? (
              activeDoc.type === 'pdf' ? (
                <div className="w-full h-full flex flex-col">
                  <div className="px-3 py-2 bg-gray-100 border-b text-xs text-gray-600 flex items-center justify-between">
                    <span className="truncate">{activeDoc.name}</span>
                    <a 
                      href={activeDoc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Abrir
                    </a>
                  </div>
                  <iframe 
                    src={activeDoc.url} 
                    title={activeDoc.name} 
                    className="w-full flex-1 border-0"
                    onError={() => console.error('Erro ao carregar PDF:', activeDoc.url)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <FileText className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600 mb-2">{activeDoc.name}</p>
                  <a 
                    href={activeDoc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Abrir Documento
                  </a>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">Selecione um documento para visualizar</p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Chat */}
        <div className="flex flex-col">
          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-orange-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span className="text-sm">Analisando documentos...</span>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  )}
                  <div className={`text-xs mt-2 text-right ${
                    message.type === 'user' ? 'text-orange-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de Mensagem */}
          <div className="bg-white border-t border-gray-200 p-4 rounded-b-xl">
            <div className="flex items-start space-x-3">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta..."
                className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                disabled={chatLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || chatLoading}
                className="px-5 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center h-full"
                style={{ minHeight: '44px' }}
              >
                {chatLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pressione Enter para enviar, Shift+Enter para nova linha.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidAnalysisPage; 