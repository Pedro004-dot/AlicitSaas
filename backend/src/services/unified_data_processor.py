"""
Unified Data Processor
Responsável por consolidar e buscar dados de diferentes fontes para os serviços.
"""
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class UnifiedDataProcessor:
    """
    Processador de dados unificado que atua como uma camada de acesso
    para buscar informações relacionadas, como documentos de uma licitação.
    """
    def __init__(self, db_manager):
        self.db_manager = db_manager

    def get_documentos_by_licitacao(self, licitacao_id: str) -> List[Dict[str, Any]]:
        """
        Busca todos os documentos associados a um ID de licitação.

        Args:
            licitacao_id: O UUID da licitação.

        Returns:
            Uma lista de dicionários, onde cada um representa um documento.
            Retorna uma lista vazia se não encontrar documentos ou em caso de erro.
        """
        sql = """
            SELECT id, titulo, arquivo_nuvem_url, tipo_arquivo
            FROM documentos_licitacao
            WHERE licitacao_id = %s
            AND status_processamento != 'concluido';
        """
        try:
            with self.db_manager.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (licitacao_id,))
                    documentos = cur.fetchall()
                    logger.info(f"Encontrados {len(documentos)} documentos para a licitação {licitacao_id}")
                    return documentos if documentos else []
        except Exception as e:
            logger.error(f"Erro ao buscar documentos para a licitação {licitacao_id}: {e}")
            return [] 