# Retrieval engine module 

import openai
import logging
from typing import List, Dict, Any, Optional
import time
import numpy as np
from sentence_transformers import CrossEncoder

logger = logging.getLogger(__name__)

class RetrievalEngine:
    """Engine de retrieval com reranking"""
    
    def __init__(self, openai_api_key: str):
        self.openai_client = openai.OpenAI(api_key=openai_api_key)
        
        # Modelo de reranking
        self.reranker = None
        self._load_reranker()
    
    def _load_reranker(self):
        """Carrega modelo de reranking"""
        try:
            logger.info("🤖 Carregando modelo de reranking...")
            
            # Modelo gratuito para reranking
            self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
            
            logger.info("✅ Modelo de reranking carregado")
            
        except Exception as e:
            logger.warning(f"⚠️ Erro ao carregar reranker: {e}")
            self.reranker = None
    
    def rerank_chunks(self, query: str, chunks: List[Dict], top_k: int = 8) -> List[Dict]:
        """Aplica reranking nos chunks recuperados"""
        try:
            if not self.reranker or len(chunks) <= top_k:
                return chunks[:top_k]
            
            logger.info(f"🔄 Aplicando reranking em {len(chunks)} chunks")
            
            # Preparar pares query-chunk para reranking
            query_chunk_pairs = []
            for chunk in chunks:
                query_chunk_pairs.append([query, chunk['text']])
            
            # Calcular scores de reranking
            rerank_scores = self.reranker.predict(query_chunk_pairs)
            
            # Combinar scores originais com reranking
            for i, chunk in enumerate(chunks):
                original_score = chunk.get('hybrid_score', chunk.get('similarity_score', 0))
                rerank_score = float(rerank_scores[i])
                
                # Combinar scores (70% rerank + 30% original)
                final_score = 0.7 * rerank_score + 0.3 * original_score
                chunk['final_score'] = final_score
                chunk['rerank_score'] = rerank_score
            
            # Reordenar por score final
            reranked_chunks = sorted(chunks, key=lambda x: x['final_score'], reverse=True)
            
            logger.info(f"✅ Reranking aplicado, retornando top {top_k}")
            return reranked_chunks[:top_k]
            
        except Exception as e:
            logger.error(f"❌ Erro no reranking: {e}")
            return chunks[:top_k]
    
    def generate_response(self, query: str, context_chunks: List[Dict], 
                         licitacao_info: Optional[Dict] = None) -> Dict[str, Any]:
        """Gera resposta usando OpenAI GPT-4"""
        try:
            logger.info("🤖 Gerando resposta com GPT-4...")
            
            # Construir contexto
            context_text = self._build_context(context_chunks, licitacao_info)
            
            # Prompt otimizado para licitações
            system_prompt = """Você é um especialista em análise de licitações públicas brasileiras. 
            Sua função é responder perguntas sobre documentos de licitação de forma precisa e detalhada.

            INSTRUÇÕES:
            1. Use APENAS as informações fornecidas no contexto
            2. Seja específico e cite números de páginas quando disponível
            3. Se a informação não estiver no contexto, diga claramente
            4. Formate valores monetários em reais (R$)
            5. Mencione artigos, cláusulas e seções específicas quando relevantes
            6. Mantenha tom profissional e técnico
            """
            
            user_prompt = f"""
            CONTEXTO DOS DOCUMENTOS:
            {context_text}
            
            PERGUNTA: {query}
            
            Responda de forma completa e estruturada, citando as fontes específicas do documento.
            """
            
            # Fazer chamada para OpenAI
            start_time = time.time()
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Mais barato que gpt-4
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,  # Baixa para respostas mais determinísticas
                max_tokens=1500
            )
            
            response_time = time.time() - start_time
            
            # Extrair resposta
            answer = response.choices[0].message.content
            
            # Calcular custos aproximados (preços de janeiro 2025)
            input_tokens = len(user_prompt.split()) * 1.3  # Aproximação
            output_tokens = len(answer.split()) * 1.3
            
            # GPT-4o-mini: $0.00015/1K input, $0.0006/1K output
            cost = (input_tokens * 0.00015 / 1000) + (output_tokens * 0.0006 / 1000)
            
            result = {
                'answer': answer,
                'chunks_used': len(context_chunks),
                'response_time': round(response_time, 2),
                'cost_usd': round(cost, 6),
                'model': "gpt-4o-mini",
                'sources': self._extract_sources(context_chunks)
            }
            
            logger.info(f"✅ Resposta gerada em {response_time:.2f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar resposta: {e}")
            return {
                'answer': f"Erro ao gerar resposta: {str(e)}",
                'error': True
            }
    
    def _build_context(self, chunks: List[Dict], licitacao_info: Optional[Dict] = None) -> str:
        """Constrói contexto para o LLM"""
        context_parts = []
        
        # Adicionar informações da licitação se disponível
        if licitacao_info:
            context_parts.append(f"""
            INFORMAÇÕES DA LICITAÇÃO:
            - Objeto: {licitacao_info.get('objeto_compra', 'N/A')}
            - Modalidade: {licitacao_info.get('modalidade_nome', 'N/A')}
            - Valor Total Estimado: R$ {licitacao_info.get('valor_total_estimado', 'N/A')}
            - Órgão: {licitacao_info.get('orgao_entidade', 'N/A')}
            - UF: {licitacao_info.get('uf', 'N/A')}
            """)
        
        # Adicionar chunks do documento
        for i, chunk in enumerate(chunks, 1):
            context_parts.append(f"""
            TRECHO {i} (Página {chunk.get('page_number', 'N/A')}):
            {chunk['text']}
            """)
        
        return "\n".join(context_parts)
    
    def _extract_sources(self, chunks: List[Dict]) -> List[Dict]:
        """Extrai informações de fonte dos chunks"""
        sources = []
        for chunk in chunks:
            source = {
                'page_number': chunk.get('page_number'),
                'chunk_type': chunk.get('chunk_type'),
                'section_title': chunk.get('section_title'),
                'score': chunk.get('final_score', chunk.get('hybrid_score', 0))
            }
            sources.append(source)
        
        return sources 