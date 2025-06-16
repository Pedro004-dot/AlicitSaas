"""
Routes para matches - endpoints HTTP
"""
from flask import Blueprint
from controllers.match_controller import MatchController

# Criar blueprint com url_prefix correto
match_routes = Blueprint('matches', __name__, url_prefix='/api/matches')

# Instanciar controller
match_controller = MatchController()

# ====== ROTAS UTILIZADAS PELO FRONTEND ======

@match_routes.route('/', methods=['GET'])
def get_matches():
    """
    GET /api/matches - Listar todas as correspondências
    
    DESCRIÇÃO:
    - Lista todos os matches encontrados entre empresas e licitações
    - Usado pelo frontend para popular a tabela principal de matches
    - Inclui score de similaridade, empresa, licitação e timestamp
    
    PARÂMETROS (Query):
    - page: Número da página (opcional)
    - limit: Itens por página (opcional)
    - min_score: Score mínimo de similaridade (opcional)
    - company_id: Filtro por empresa específica (opcional)
    
    RETORNA:
    - Array de matches com informações básicas
    - Score de compatibilidade (0.0 a 1.0)
    - Dados resumidos da empresa e licitação
    """
    return match_controller.get_all_matches()

@match_routes.route('/by-company', methods=['GET'])
def get_matches_by_company():
    """
    GET /api/matches/by-company - Correspondências agrupadas por empresa
    
    DESCRIÇÃO:
    - Agrupa todos os matches por empresa
    - Usado pelo frontend para mostrar estatísticas por empresa
    - Inclui contadores de matches e scores médios
    
    PARÂMETROS (Query):
    - min_matches: Mínimo de matches para incluir empresa
    - order_by: Ordenação (score_avg, matches_count, company_name)
    
    RETORNA:
    - Array de empresas com seus matches agregados
    - Estatísticas: total de matches, score médio, melhor match
    - Informações resumidas da empresa
    """
    return match_controller.get_matches_by_company()

@match_routes.route('/recent', methods=['GET'])
def get_recent_matches():
    """
    GET /api/matches/recent - Correspondências mais recentes com dados completos
    
    DESCRIÇÃO:
    - Lista os matches mais recentes com informações completas
    - Inclui dados da empresa (nome, razão social) e licitação (objeto, valor, UF)
    - Usado pelo frontend na página Home para mostrar atividade recente
    - Ordenado por timestamp decrescente (mais recente primeiro)
    
    PARÂMETROS (Query):
    - limit: Quantidade máxima de registros (opcional, padrão: 5)
    - min_score: Score mínimo para incluir no resultado (opcional)
    
    RETORNA:
    - Array de matches com dados expandidos:
      * ID do match, score (%), tipo de match, timestamp
      * Empresa: id, nome, razão_social
      * Licitação: id, pncp_id, objeto_compra, valor_total_estimado, uf
    - Ordenados por data de criação (mais recente primeiro)
    """
    return match_controller.get_recent_matches()

# ====== ROTAS ADMINISTRATIVAS (PARA MANUTENÇÃO) ======

@match_routes.route('/grouped', methods=['GET'])
def get_matches_grouped():
    """
    GET /api/matches/grouped - Correspondências agrupadas
    
    DESCRIÇÃO:
    - Retorna matches organizados em diferentes agrupamentos
    - Usado para análises administrativas e relatórios
    - Pode agrupar por período, score, modalidade, etc.
    
    PARÂMETROS (Query):
    - group_by: Critério de agrupamento (score_range, date, modalidade)
    - period: Período para agrupamento temporal (day, week, month)
    
    RETORNA:
    - Objeto com matches organizados por critério escolhido
    - Estatísticas agregadas por grupo
    - Contadores e médias por categoria
    """
    return match_controller.get_matches_grouped()

@match_routes.route('/statistics', methods=['GET'])
def get_matches_statistics():
    """
    GET /api/matches/statistics - Estatísticas gerais de matches
    
    DESCRIÇÃO:
    - Calcula métricas abrangentes sobre todos os matches
    - Usado para dashboards administrativos e relatórios
    - Inclui distribuições, tendências e análises de qualidade
    
    PARÂMETROS (Query):
    - period: Período de análise (last_week, last_month, all_time)
    - include_details: Incluir detalhes por categoria (boolean)
    
    RETORNA:
    - Total de matches e distribuição por score
    - Empresas mais ativas e licitações mais procuradas
    - Tendências temporais e métricas de qualidade
    - Performance do algoritmo de matching
    """
    return match_controller.get_matches_statistics()

 