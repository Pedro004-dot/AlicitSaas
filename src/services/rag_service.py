import logging
from typing import Dict, Any, Optional, List
import time
from datetime import datetime

# Importar componentes RAG
from rag.document_processor import DocumentProcessor
from rag.embedding_service import EmbeddingService
from rag.vector_store import VectorStore
from rag.cache_manager import CacheManager
from rag.retrieval_engine import RetrievalEngine

logger = logging.getLogger(__name__)

class RAGService:
    """Serviço principal de RAG para licitações"""
    
    def __init__(self, db_manager, unified_processor, openai_api_key: str, 
                 redis_host: str = "localhost"):
        self.db_manager = db_manager
        self.unified_processor = unified_processor
        
        # Inicializar componentes RAG
        self.document_processor = DocumentProcessor()
        self.embedding_service = EmbeddingService()
        self.vector_store = VectorStore(db_manager)
        self.cache_manager = CacheManager(redis_host=redis_host)
        self.retrieval_engine = RetrievalEngine(openai_api_key)
        
        logger.info("✅ RAGService inicializado")
    
    def process_or_query(self, licitacao_id: str, query: str) -> Dict[str, Any]:
        """Função principal: processa documentos se necessário e responde query"""
        try:
            logger.info(f"🚀 Iniciando RAG para licitação: {licitacao_id}")
            
            # 1. Verificar cache primeiro
            cached_result = self.cache_manager.get_cached_query_result(query, licitacao_id)
            if cached_result:
                logger.info("⚡ Resultado encontrado no cache")
                return {
                    'success': True,
                    'cached': True,
                    **cached_result
                }
            
            # 2. Verificar se documentos estão vetorizados
            status = self.vector_store.check_vectorization_status(licitacao_id)
                         
            if not status.get('vetorizado_completo', False):
                # 3. Processar documentos se necessário (inclui extração recursiva de ZIPs)
                logger.info("📝 Documentos não vetorizados, iniciando processamento completo...")
                print("📝 Documentos não vetorizados, iniciando processamento completo...")
                vectorization_result = self._vectorize_licitacao(licitacao_id)
                print(f"vectorization_result: {vectorization_result}")
                
                if not vectorization_result['success']:
                    # Incluir detalhes de diagnóstico no resultado
                    error_response = {
                        'success': False,
                        'error': vectorization_result.get('error'),
                        'processing_details': {
                            'action': vectorization_result.get('action', 'unknown'),
                            'suggestion': vectorization_result.get('suggestion'),
                            'licitacao_info': vectorization_result.get('licitacao_info')
                        }
                    }
                    return error_response
            
            # 4. Responder query
            response_result = self._answer_query(query, licitacao_id)
            
            # 5. Cachear resultado
            if response_result['success']:
                self.cache_manager.cache_query_result(
                    query, licitacao_id, response_result, ttl=3600
                )
                
                # Adicionar informações de processamento se documentos foram processados nesta sessão
                if not status.get('vetorizado_completo', False):
                    response_result['processing_info'] = {
                        'documents_processed_this_session': True,
                        'processing_method': 'recursive_zip_extraction',
                        'vectorization_completed': True
                    }
            
            return response_result
            
        except Exception as e:
            logger.error(f"❌ Erro no processamento RAG: {e}")
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }
    
    def _vectorize_licitacao(self, licitacao_id: str) -> Dict[str, Any]:
        """Vetoriza todos os documentos de uma licitação"""
        try:
            # 1. Verificar e processar documentos automaticamente se necessário
            documentos_result = self._ensure_documents_processed(licitacao_id)
            if not documentos_result['success']:
                return documentos_result
            
            # 2. Obter documentos do banco
            documentos = self.unified_processor.obter_documentos_licitacao(licitacao_id)
            
            if not documentos:
                return {
                    'success': False,
                    'error': 'Nenhum documento encontrado para vetorização'
                }
            
            # 3. Verificar se já temos chunks vetorizados
            total_existing_chunks = 0
            for documento in documentos:
                chunks_count = self.vector_store.count_document_chunks(documento['id'])
                total_existing_chunks += chunks_count
                if chunks_count > 0:
                    logger.info(f"⏭️ Documento já vetorizado: {documento['titulo']} ({chunks_count} chunks)")
            
            # Se já temos chunks, considerar como sucesso
            if total_existing_chunks > 0:
                logger.info(f"✅ Vetorização já concluída: {len(documentos)} documentos, {total_existing_chunks} chunks existentes")
                return {
                    'success': True,
                    'message': 'Documentos já estavam vetorizados',
                    'processed_documents': len(documentos),
                    'total_chunks': total_existing_chunks,
                    'already_vectorized': True
                }
            
            # 4. Processar cada documento que ainda não foi vetorizado
            total_chunks = 0
            processed_docs = 0
            
            logger.info(f"📋 Processando {len(documentos)} documentos para vetorização...")
            
            for idx, documento in enumerate(documentos, 1):
                logger.info(f"📄 Processando documento {idx}/{len(documentos)}: {documento['titulo']}")
                # Verificar se já tem chunks vetorizados
                existing_chunks = self.vector_store.count_document_chunks(documento['id'])
                if existing_chunks > 0:
                    logger.info(f"⏭️ Documento já vetorizado: {documento['titulo']} ({existing_chunks} chunks)")
                    total_chunks += existing_chunks
                    processed_docs += 1
                    continue
                
                # Marcar como processando
                self._update_document_status(documento['id'], 'processando')
                
                try:
                    # Extrair texto
                    texto_completo = self.document_processor.extract_text_from_url(
                        documento['arquivo_nuvem_url']
                    )
                    
                    if not texto_completo:
                        self._update_document_status(documento['id'], 'erro')
                        continue
                    
                    # Salvar texto extraído
                    self._save_extracted_text(documento['id'], texto_completo)
                    
                    # Criar chunks inteligentes
                    chunks = self.document_processor.create_intelligent_chunks(
                        texto_completo, documento['id']
                    )
                    
                    if not chunks:
                        self._update_document_status(documento['id'], 'erro')
                        continue
                    
                    # Gerar embeddings com fallback
                    chunk_texts = [chunk.text for chunk in chunks]
                    embeddings = self.embedding_service.generate_embeddings(chunk_texts)
                    
                    # Verificar se embeddings foram gerados com sucesso
                    if not embeddings or len(embeddings) != len(chunks):
                        logger.warning(f"⚠️ VoyageAI falhou para {documento['titulo']}, tentando fallback OpenAI...")
                        
                        # Tentar fallback com OpenAI (se disponível)
                        try:
                            from matching.vectorizers import OpenAITextVectorizer
                            openai_vectorizer = OpenAITextVectorizer()
                            embeddings = []
                            
                            # Processar em lotes menores para OpenAI
                            batch_size = 50
                            for i in range(0, len(chunk_texts), batch_size):
                                batch = chunk_texts[i:i + batch_size]
                                batch_embeddings = openai_vectorizer.vectorize_batch(batch)
                                if batch_embeddings:
                                    embeddings.extend(batch_embeddings)
                                else:
                                    logger.error(f"❌ OpenAI fallback também falhou no batch {i//batch_size + 1}")
                                    break
                            
                            if len(embeddings) != len(chunks):
                                logger.error(f"❌ Fallback OpenAI falhou para {documento['titulo']}")
                                logger.error(f"📊 Esperado: {len(chunks)} embeddings, Recebido: {len(embeddings)}")
                                self._update_document_status(documento['id'], 'erro_embedding')
                                continue
                            else:
                                logger.info(f"✅ Fallback OpenAI funcionou para {documento['titulo']}")
                                
                        except Exception as fallback_error:
                            logger.error(f"❌ Fallback OpenAI falhou: {fallback_error}")
                            self._update_document_status(documento['id'], 'erro_embedding')
                            continue
                    
                    # Converter chunks para dicionários
                    chunk_dicts = []
                    for chunk in chunks:
                        chunk_dict = {
                            'text': chunk.text,
                            'chunk_type': chunk.chunk_type,
                            'page_number': chunk.page_number,
                            'section_title': chunk.section_title,
                            'token_count': chunk.token_count,
                            'char_count': chunk.char_count,
                            'metadata': chunk.metadata or {}
                        }
                        chunk_dicts.append(chunk_dict)
                    
                    # Salvar no vector store
                    success = self.vector_store.save_chunks_with_embeddings(
                        documento['id'], licitacao_id, chunk_dicts, embeddings
                    )
                    
                    if success:
                        total_chunks += len(chunks)
                        processed_docs += 1
                        logger.info(f"✅ Documento vetorizado: {documento['titulo']} ({len(chunks)} chunks)")
                    else:
                        self._update_document_status(documento['id'], 'erro')
                
                except Exception as e:
                    logger.error(f"❌ Erro ao vetorizar {documento['titulo']}: {e}")
                    self._update_document_status(documento['id'], 'erro')
                    continue
            
            if processed_docs > 0:
                logger.info(f"🎉 Vetorização concluída: {processed_docs} documentos, {total_chunks} chunks")
                return {
                    'success': True,
                    'message': 'Documentos vetorizados com sucesso',
                    'processed_documents': processed_docs,
                    'total_chunks': total_chunks
                }
            else:
                return {
                    'success': False,
                    'error': 'Nenhum documento foi vetorizado com sucesso'
                }
                
        except Exception as e:
            logger.error(f"❌ Erro na vetorização: {e}")
            return {
                'success': False,
                'error': f'Erro na vetorização: {str(e)}'
            }
    
    def _answer_query(self, query: str, licitacao_id: str) -> Dict[str, Any]:
        """Responde uma query usando RAG"""
        try:
            start_time = time.time()
            
            # 1. Gerar embedding da query
            query_embedding = self.embedding_service.generate_single_embedding(query)
            
            if not query_embedding:
                return {
                    'success': False,
                    'error': 'Erro ao gerar embedding da consulta'
                }
            
            # 2. Buscar chunks relevantes (híbrida)
            chunks = self.vector_store.hybrid_search(
                query, query_embedding, licitacao_id, limit=12  # Buscar mais para reranking
            )
            
            if not chunks:
                return {
                    'success': False,
                    'error': 'Nenhum conteúdo relevante encontrado nos documentos'
                }
            
            # 3. Aplicar reranking
            top_chunks = self.retrieval_engine.rerank_chunks(query, chunks, top_k=8)
            
            # 4. Obter informações da licitação
            licitacao_info = self.unified_processor.extrair_info_licitacao(licitacao_id)
            
            # 5. Gerar resposta
            response_result = self.retrieval_engine.generate_response(
                query, top_chunks, licitacao_info
            )
            
            if response_result.get('error'):
                return {
                    'success': False,
                    'error': response_result['answer']
                }
            
            processing_time = time.time() - start_time
            
            # 6. Montar resultado final
            result = {
                'success': True,
                'answer': response_result['answer'],
                'query': query,
                'licitacao_id': licitacao_id,
                'chunks_used': response_result['chunks_used'],
                'sources': response_result['sources'],
                'processing_time': round(processing_time, 2),
                'model_response_time': response_result.get('response_time'),
                'cost_usd': response_result.get('cost_usd'),
                'model': response_result.get('model'),
                'cached': False
            }
            
            logger.info(f"✅ Query respondida em {processing_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao responder query: {e}")
            return {
                'success': False,
                'error': f'Erro ao processar consulta: {str(e)}'
            }
    
    def _ensure_documents_processed(self, licitacao_id: str) -> Dict[str, Any]:
        """
        🚀 NOVA FUNÇÃO: Garante que documentos estão processados usando UnifiedDocumentProcessor recursivo
        Integração completa do processamento recursivo de ZIPs no fluxo RAG
        """
        try:
            logger.info(f"🔍 Verificando documentos para licitação: {licitacao_id}")
            
            # 1. Verificar se documentos já existem
            documentos_existem = self.unified_processor.verificar_documentos_existem(licitacao_id)
            
            if documentos_existem:
                # Verificar se documentos são válidos (não corrompidos/vazios)
                documentos = self.unified_processor.obter_documentos_licitacao(licitacao_id)
                
                # Validar se temos documentos úteis
                documentos_validos = []
                for doc in documentos:
                    # Verificar se é arquivo útil (PDF, DOC, etc) e não está corrompido
                    if (doc.get('tipo_arquivo') in ['application/pdf', 'application/msword'] and 
                        doc.get('tamanho_arquivo', 0) > 1000):  # Arquivos > 1KB
                        documentos_validos.append(doc)
                
                if documentos_validos:
                    logger.info(f"✅ {len(documentos_validos)} documentos válidos já processados")
                    return {
                        'success': True,
                        'message': 'Documentos já processados',
                        'documentos_count': len(documentos_validos),
                        'action': 'documents_already_exist'
                    }
                else:
                    logger.warning(f"⚠️ Documentos existem mas são inválidos, reprocessando...")
                    # Limpar documentos inválidos
                    self.unified_processor._limpar_documentos_licitacao(licitacao_id)
            
            # 2. Processar documentos usando nossa lógica recursiva aprimorada
            logger.info("📥 Iniciando processamento recursivo de documentos...")
            
            # Primeiro, validar se a licitação existe
            licitacao_info = self.unified_processor.extrair_info_licitacao(licitacao_id)
            if not licitacao_info:
                return {
                    'success': False,
                    'error': f'Licitação {licitacao_id} não encontrada no banco de dados',
                    'action': 'licitacao_not_found'
                }
            
            # Tentar processar documentos (método assíncrono)
            import asyncio
            result = asyncio.run(self.unified_processor.processar_documentos_licitacao(licitacao_id))
            
            if result['success']:
                logger.info(f"🎉 Processamento recursivo concluído: {result.get('documentos_processados', 0)} documentos")
                return {
                    'success': True,
                    'message': 'Documentos processados com sucesso usando extração recursiva',
                    'documentos_processados': result.get('documentos_processados', 0),
                    'storage_provider': result.get('storage_provider', 'supabase'),
                    'pasta_nuvem': result.get('pasta_nuvem'),
                    'action': 'documents_processed_recursive'
                }
            else:
                # Se falhou, tentar diagnosticar o problema
                error_detail = result.get('error', 'Erro desconhecido')
                logger.error(f"❌ Falha no processamento: {error_detail}")
                
                # Verificar se é problema da API PNCP
                if 'API PNCP' in error_detail or 'HTTP' in error_detail:
                    return {
                        'success': False,
                        'error': f'Erro na API PNCP: {error_detail}',
                        'suggestion': 'Verifique se a licitação possui documentos disponíveis na API',
                        'action': 'api_error'
                    }
                
                # Outros erros
                return {
                    'success': False,
                    'error': f'Erro no processamento de documentos: {error_detail}',
                    'licitacao_info': {
                        'objeto': licitacao_info.get('objeto_compra', 'N/A')[:100] + '...',
                        'orgao': licitacao_info.get('orgao_entidade', 'N/A'),
                        'uf': licitacao_info.get('uf', 'N/A')
                    },
                    'action': 'processing_error'
                }
                
        except Exception as e:
            logger.error(f"❌ Erro crítico ao garantir documentos processados: {e}")
            return {
                'success': False,
                'error': f'Erro crítico no processamento: {str(e)}',
                'action': 'critical_error'
            }
    
    def _update_document_status(self, documento_id: str, status: str):
        """Atualiza status de processamento do documento"""
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE documentos_licitacao 
                        SET status_processamento = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (status, documento_id))
                    conn.commit()
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar status: {e}")
    
    def _save_extracted_text(self, documento_id: str, texto: str):
        """Salva texto extraído no banco"""
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE documentos_licitacao 
                        SET texto_extraido = %s, updated_at = NOW()
                        WHERE id = %s
                    """, (texto, documento_id))
                    conn.commit()
        except Exception as e:
            logger.error(f"❌ Erro ao salvar texto: {e}")
    
    def get_licitacao_stats(self, licitacao_id: str) -> Dict[str, Any]:
        """Retorna estatísticas de uma licitação"""
        try:
            status = self.vector_store.check_vectorization_status(licitacao_id)
            cache_stats = self.cache_manager.get_cache_stats()
            
            return {
                'licitacao_id': licitacao_id,
                'vectorization_status': status,
                'cache_stats': cache_stats,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter stats: {e}")
            return {'error': str(e)}
