from flask import Blueprint, request
from controllers.rag_controller import RAGController

def create_rag_routes(rag_service):
    """Factory para criar rotas RAG"""
    
    rag_bp = Blueprint('rag', __name__, url_prefix='/api/rag')
    rag_controller = RAGController(rag_service)
    
    @rag_bp.route('/analisarDocumentos', methods=['POST', 'OPTIONS'])
    def analisar_documentos():
        """
        Endpoint principal para análise de documentos de licitação
        
        Body JSON:
        {
            "licitacao_id": "uuid",
            "query": "string (opcional)"
        }
        """
        if request.method == 'OPTIONS':
            return '', 204
        return rag_controller.analisar_documentos()
    
    @rag_bp.route('/query', methods=['POST', 'OPTIONS'])
    def query_licitacao():
        """
        Endpoint para fazer perguntas específicas sobre uma licitação
        
        Body JSON:
        {
            "licitacao_id": "uuid",
            "query": "string"
        }
        """
        if request.method == 'OPTIONS':
            return '', 204
        return rag_controller.query_licitacao()
    
    @rag_bp.route('/status', methods=['GET'])
    def status_licitacao():
        """
        Endpoint para verificar status de processamento
        
        Query params:
        - licitacao_id: UUID da licitação
        """
        return rag_controller.status_licitacao()
    
    @rag_bp.route('/cache/invalidate', methods=['POST', 'OPTIONS'])
    def invalidar_cache():
        """
        Endpoint para invalidar cache de uma licitação
        
        Body JSON:
        {
            "licitacao_id": "uuid"
        }
        """
        if request.method == 'OPTIONS':
            return '', 204
        return rag_controller.invalidar_cache()
    
    @rag_bp.route('/reprocessar', methods=['POST', 'OPTIONS'])
    def reprocessar_documentos():
        """
        Endpoint para forçar reprocessamento de documentos com extração recursiva
        
        Body JSON:
        {
            "licitacao_id": "uuid",
            "forcar_reprocessamento": true (opcional, padrão: true)
        }
        """
        if request.method == 'OPTIONS':
            return '', 204
        return rag_controller.reprocessar_documentos()
    
    return rag_bp 