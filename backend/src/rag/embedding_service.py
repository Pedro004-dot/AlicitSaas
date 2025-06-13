# Embedding service module 
import numpy as np
from sentence_transformers import SentenceTransformer
import logging
from typing import List, Optional
import torch

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Serviço de embeddings usando Sentence Transformers"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        self.embedding_dim = 384  # Dimensão do all-MiniLM-L6-v2
        self._load_model()
    
    def _load_model(self):
        """Carrega o modelo de embeddings"""
        try:
            logger.info(f"🤖 Carregando modelo: {self.model_name}")
            
            # Verificar se CUDA está disponível
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            logger.info(f"🔧 Usando device: {device}")
            
            self.model = SentenceTransformer(self.model_name, device=device)
            
            logger.info(f"✅ Modelo carregado com sucesso")
            
        except Exception as e:
            logger.error(f"❌ Falha ao carregar modelo de embeddings: {e}")
            logger.error("💡 Verifique a conexão com a internet, o nome do modelo ou se as dependências (torch, transformers) estão instaladas corretamente.")
            # Não lançar a exceção para permitir que a aplicação inicie
            # A falha será detectada quando o método generate_embeddings for chamado
            self.model = None
    
    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> Optional[List[List[float]]]:
        """Gera embeddings para uma lista de textos"""
        
        if self.model is None:
            logger.error("❌ Modelo de embedding não carregado. Não é possível gerar embeddings.")
            return None
            
        try:
            logger.info(f"🔄 Gerando embeddings para {len(texts)} textos")
            
            # Processar em batches para eficiência
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                
                # Gerar embeddings
                batch_embeddings = self.model.encode(
                    batch_texts,
                    convert_to_tensor=False,
                    show_progress_bar=False,
                    normalize_embeddings=True  # L2 normalization para cosine similarity
                )
                
                # Converter para lista
                if isinstance(batch_embeddings, np.ndarray):
                    batch_embeddings = batch_embeddings.tolist()
                
                all_embeddings.extend(batch_embeddings)
                
                logger.debug(f"📊 Batch {i//batch_size + 1}: {len(batch_embeddings)} embeddings")
            
            logger.info(f"✅ {len(all_embeddings)} embeddings gerados")
            return all_embeddings
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar embeddings: {e}")
            raise
    
    def generate_single_embedding(self, text: str) -> List[float]:
        """Gera embedding para um único texto"""
        embeddings = self.generate_embeddings([text])
        return embeddings[0] if embeddings else []
    
    def similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calcula similaridade cosseno entre dois embeddings"""
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"❌ Erro ao calcular similaridade: {e}")
            return 0.0 