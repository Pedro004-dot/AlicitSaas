"""
Routes para empresas - endpoints HTTP
"""
from flask import Blueprint
from controllers.company_controller import CompanyController

# Criar blueprint com url_prefix correto
company_routes = Blueprint('companies', __name__, url_prefix='/api/companies')

# Instanciar controller
company_controller = CompanyController()

# ====== ROTAS UTILIZADAS PELO FRONTEND (CRUD COMPLETO) ======

@company_routes.route('/', methods=['GET'], strict_slashes=False)
def get_companies():
    """
    GET /api/companies - Listar todas as empresas
    
    DESCRIÇÃO:
    - Lista todas as empresas cadastradas no sistema
    - Usado pelo frontend para popular a tabela de empresas
    - Inclui dados básicos como nome, CNPJ, status e palavras-chave
    
    PARÂMETROS (Query):
    - page: Número da página (opcional)
    - limit: Itens por página (opcional)
    - status: Filtro por status ativo/inativo (opcional)
    
    RETORNA:
    - Array de empresas com informações básicas
    - Metadados de paginação quando aplicável
    """
    return company_controller.get_all_companies()

@company_routes.route('/', methods=['POST'], strict_slashes=False)
def create_company():
    """
    POST /api/companies - Criar nova empresa
    
    DESCRIÇÃO:
    - Cadastra uma nova empresa no sistema
    - Usado pelo frontend no formulário de criação
    - Valida CNPJ, razão social e palavras-chave obrigatórias
    
    PARÂMETROS (Body JSON):
    - razao_social: Nome da empresa (obrigatório)
    - cnpj: CNPJ válido (obrigatório)
    - palavras_chave: Array de strings com especialidades
    - descricao: Descrição da empresa (opcional)
    - porte: Pequeno/Médio/Grande (opcional)
    
    RETORNA:
    - Dados da empresa criada com ID gerado
    - Status de sucesso ou erro de validação
    """
    return company_controller.create_company()

@company_routes.route('/<string:company_id>', methods=['PUT'], strict_slashes=False)
def update_company(company_id):
    """
    PUT /api/companies/<id> - Atualizar empresa
    
    DESCRIÇÃO:
    - Atualiza dados de uma empresa existente
    - Usado pelo frontend no formulário de edição
    - Permite atualizar todos os campos exceto ID e timestamps
    
    PARÂMETROS:
    - company_id: ID único da empresa no sistema
    
    PARÂMETROS (Body JSON):
    - razao_social: Nome da empresa
    - cnpj: CNPJ válido
    - palavras_chave: Array atualizado de especialidades
    - descricao: Nova descrição
    - porte: Porte atualizado
    
    RETORNA:
    - Dados da empresa atualizada
    - Status de sucesso ou erro
    """
    return company_controller.update_company(company_id)

@company_routes.route('/<string:company_id>', methods=['DELETE'], strict_slashes=False)
def delete_company(company_id):
    """
    DELETE /api/companies/<id> - Deletar empresa
    
    DESCRIÇÃO:
    - Remove uma empresa do sistema permanentemente
    - Usado pelo frontend na confirmação de exclusão
    - Remove também todos os matches relacionados
    
    PARÂMETROS:
    - company_id: ID único da empresa no sistema
    
    RETORNA:
    - Confirmação de exclusão bem-sucedida
    - Quantidade de registros relacionados removidos
    """
    return company_controller.delete_company(company_id)

# ====== ROTAS ADMINISTRATIVAS (PARA MANUTENÇÃO) ======

@company_routes.route('/profile', methods=['GET'], strict_slashes=False)
def get_companies_profile():
    """
    GET /api/companies/profile - Perfil das empresas
    
    DESCRIÇÃO:
    - Gera análise agregada do perfil das empresas
    - Mostra distribuição por porte, especialidades mais comuns
    - Usado para relatórios executivos e análises de mercado
    
    RETORNA:
    - Distribuição por porte (pequeno/médio/grande)
    - Top 10 palavras-chave mais utilizadas
    - Estatísticas de crescimento e cadastros
    """
    return company_controller.get_companies_profile()

@company_routes.route('/statistics', methods=['GET'], strict_slashes=False)
def get_companies_statistics():
    """
    GET /api/companies/statistics - Estatísticas das empresas
    
    DESCRIÇÃO:
    - Calcula métricas detalhadas sobre as empresas
    - Inclui totais, médias, distribuições e tendências
    - Usado para dashboards administrativos
    
    RETORNA:
    - Total de empresas ativas/inativas
    - Distribuição geográfica por estado
    - Médias de palavras-chave por empresa
    - Estatísticas de crescimento mensal
    """
    return company_controller.get_companies_statistics()

@company_routes.route('/health', methods=['GET'], strict_slashes=False)
def get_companies_health():
    """
    GET /api/companies/health - Health check das empresas
    
    DESCRIÇÃO:
    - Verifica a integridade dos dados das empresas
    - Identifica registros com problemas ou inconsistências
    - Usado para monitoramento e manutenção preventiva
    
    RETORNA:
    - Status geral da qualidade dos dados
    - Contagem de registros com problemas
    - Sugestões de correções necessárias
    """
    return company_controller.get_companies_health()

@company_routes.route('/matches', methods=['GET'], strict_slashes=False)
def get_companies_with_matches():
    """
    GET /api/companies/matches - Empresas com resumo de matches
    
    DESCRIÇÃO:
    - Lista empresas incluindo estatísticas de matches
    - Mostra quantos matches cada empresa possui
    - Usado para análise de performance e engajamento
    
    PARÂMETROS (Query):
    - min_matches: Filtro por quantidade mínima de matches
    - order_by: Ordenação (matches_count, company_name, etc.)
    
    RETORNA:
    - Array de empresas com contadores de matches
    - Score médio de compatibilidade por empresa
    - Data do último match encontrado
    """
    return company_controller.get_companies_with_matches() 