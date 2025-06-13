# Vector store module 

import psycopg2
from psycopg2.extras import DictCursor
import logging
from typing import List, Dict, Optional, Tuple, Any
import json
import uuid

logger = logging.getLogger(__name__)

class VectorStore:
    """Store de vetores usando pgvector no Supabase"""
    
    def __init__(self, db_manager):
        self.db_manager = db_manager
    
    def save_chunks_with_embeddings(self, documento_id: str, licitacao_id: str, 
                                   chunks: List[Dict], embeddings: List[List[float]]) -> bool:
        """Salva chunks com embeddings no banco"""
        try:
            if len(chunks) != len(embeddings):
                raise ValueError("Número de chunks e embeddings deve ser igual")
            
            logger.info(f"💾 Salvando {len(chunks)} chunks com embeddings")
            
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    
                    # Inserir chunks
                    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        chunk_id = str(uuid.uuid4())
                        
                        cursor.execute("""
                            INSERT INTO documentos_chunks (
                                id, documento_id, licitacao_id, chunk_index,
                                chunk_text, chunk_type, page_number, section_title,
                                token_count, char_count, embedding, metadata_chunk
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """, (
                            chunk_id,
                            documento_id,
                            licitacao_id,
                            i,
                            chunk['text'],
                            chunk['chunk_type'],
                            chunk['page_number'],
                            chunk.get('section_title'),
                            chunk['token_count'],
                            chunk['char_count'],
                            embedding,  # pgvector aceita lista diretamente
                            json.dumps(chunk.get('metadata', {}))
                        ))
                    
                    # Atualizar status do documento
                    cursor.execute("""
                        UPDATE documentos_licitacao 
                        SET vetorizado = true, 
                            status_processamento = 'concluido',
                            chunks_count = %s
                        WHERE id = %s
                    """, (len(chunks), documento_id))
                    
                    conn.commit()
            
            logger.info(f"✅ Chunks salvos com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao salvar chunks: {e}")
            return False
    
    def hybrid_search(self, query_text: str, query_embedding: List[float], 
                     licitacao_id: str, limit: int = 8, 
                     semantic_weight: float = 0.7, text_weight: float = 0.3) -> List[Dict]:
        """Busca híbrida (semântica + textual)"""
        try:
            logger.info(f"🔍 Busca híbrida para: {query_text[:50]}...")
            logger.info(f"🎯 Licitação ID: {licitacao_id}")
            logger.info(f"📊 Embedding size: {len(query_embedding) if query_embedding else 0}")
            
            # PRIMEIRO: Verificar se existem chunks para esta licitação
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*) as total_chunks 
                        FROM documentos_chunks 
                        WHERE licitacao_id = %s
                    """, (licitacao_id,))
                    
                    total_result = cursor.fetchone()
                    total_chunks = total_result[0] if total_result else 0
                    logger.info(f"📋 Total de chunks disponíveis para esta licitação: {total_chunks}")
                    
                    if total_chunks == 0:
                        logger.warning(f"⚠️ Nenhum chunk encontrado para licitação {licitacao_id}")
                        return []
            
            # SEGUNDO: Verificar se a função hybrid_search existe
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    try:
                        cursor.execute("""
                            SELECT routine_name 
                            FROM information_schema.routines 
                            WHERE routine_name = 'hybrid_search'
                        """)
                        function_exists = cursor.fetchone()
                        
                        if not function_exists:
                            logger.error("❌ Função hybrid_search não encontrada no banco!")
                            logger.info("🔄 Tentando busca semântica simples como fallback...")
                            return self.semantic_search(query_embedding, licitacao_id, limit)
                        else:
                            logger.info("✅ Função hybrid_search encontrada no banco")
                            
                    except Exception as check_error:
                        logger.warning(f"⚠️ Erro ao verificar função: {check_error}")
                        logger.info("🔄 Tentando busca híbrida mesmo assim...")
            
            # TERCEIRO: Tentar a busca híbrida
            with self.db_manager.get_connection() as conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    
                    try:
                        # Usar função SQL customizada para busca híbrida
                        cursor.execute("""
                            SELECT * FROM hybrid_search(
                                %s::vector, 
                                %s::text, 
                                %s::uuid, 
                                %s::int, 
                                %s::float, 
                                %s::float
                            )
                        """, (
                            query_embedding,
                            query_text,
                            licitacao_id,
                            limit,
                            semantic_weight,
                            text_weight
                        ))
                        
                        results = cursor.fetchall()
                        logger.info(f"📊 Query híbrida retornou {len(results)} resultados")
                        
                        # Converter para dicionários
                        chunks = []
                        for row in results:
                            chunk = {
                                'chunk_id': str(row['chunk_id']),
                                'text': row['chunk_text'],
                                'semantic_score': float(row['semantic_score']),
                                'text_score': float(row['text_score']),
                                'hybrid_score': float(row['hybrid_score']),
                                'metadata': row['metadata_chunk']
                            }
                            chunks.append(chunk)
                        
                        logger.info(f"✅ Encontrados {len(chunks)} chunks relevantes")
                        return chunks
                        
                    except Exception as hybrid_error:
                        logger.error(f"❌ Erro na função hybrid_search: {hybrid_error}")
                        logger.info("🔄 Tentando busca semântica simples como fallback...")
                        return self.semantic_search(query_embedding, licitacao_id, limit)
            
        except Exception as e:
            logger.error(f"❌ Erro geral na busca híbrida: {e}")
            logger.info("🔄 Tentando busca semântica simples como último recurso...")
            return self.semantic_search(query_embedding, licitacao_id, limit)
    
    def semantic_search(self, query_embedding: List[float], 
                       licitacao_id: str, limit: int = 8) -> List[Dict]:
        """Busca puramente semântica"""
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    
                    cursor.execute("""
                        SELECT 
                            id as chunk_id,
                            chunk_text,
                            chunk_type,
                            page_number,
                            section_title,
                            1 - (embedding <=> %s) as similarity_score,
                            metadata_chunk
                        FROM documentos_chunks 
                        WHERE licitacao_id = %s
                        ORDER BY embedding <=> %s
                        LIMIT %s
                    """, (query_embedding, licitacao_id, query_embedding, limit))
                    
                    results = cursor.fetchall()
                    
                    chunks = []
                    for row in results:
                        chunk = {
                            'chunk_id': str(row['chunk_id']),
                            'text': row['chunk_text'],
                            'chunk_type': row['chunk_type'],
                            'page_number': row['page_number'],
                            'section_title': row['section_title'],
                            'similarity_score': float(row['similarity_score']),
                            'metadata': row['metadata_chunk']
                        }
                        chunks.append(chunk)
                    
                    return chunks
            
        except Exception as e:
            logger.error(f"❌ Erro na busca semântica: {e}")
            return []
    
    def check_vectorization_status(self, licitacao_id: str) -> Dict[str, Any]:
        """Verifica status de vetorização de uma licitação"""
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor(cursor_factory=DictCursor) as cursor:
                    
                    cursor.execute("""
                        SELECT 
                            COUNT(*) as total_documentos,
                            COUNT(CASE WHEN vetorizado = true THEN 1 END) as documentos_vetorizados,
                            SUM(chunks_count) as total_chunks
                        FROM documentos_licitacao 
                        WHERE licitacao_id = %s
                    """, (licitacao_id,))
                    
                    result = cursor.fetchone()
                    
                    if result:
                        return {
                            'total_documentos': result['total_documentos'],
                            'documentos_vetorizados': result['documentos_vetorizados'],
                            'total_chunks': result['total_chunks'] or 0,
                            'vetorizado_completo': (
                                result['total_documentos'] > 0 and 
                                result['documentos_vetorizados'] == result['total_documentos']
                            )
                        }
                    else:
                        return {
                            'total_documentos': 0,
                            'documentos_vetorizados': 0,
                            'total_chunks': 0,
                            'vetorizado_completo': False
                        }
            
        except Exception as e:
            logger.error(f"❌ Erro ao verificar status: {e}")
            return {'error': str(e)} 
    
    def count_document_chunks(self, documento_id: str) -> int:
        """Conta quantos chunks existem para um documento específico"""
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM documentos_chunks 
                        WHERE documento_id = %s
                    """, (documento_id,))
                    
                    result = cursor.fetchone()
                    return result[0] if result else 0
                    
        except Exception as e:
            logger.error(f"❌ Erro ao contar chunks do documento {documento_id}: {e}")
            return 0