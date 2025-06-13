"""
Controller para operações com empresas
"""
import logging
from flask import request, jsonify
from services.company_service import CompanyService
from exceptions.api_exceptions import ValidationError, NotFoundError, DatabaseError

logger = logging.getLogger(__name__)

class CompanyController:
    """Controller para gerenciar operações HTTP relacionadas a empresas"""
    
    def __init__(self):
        """Inicializar controller com service"""
        self.company_service = CompanyService()
    
    def get_all_companies(self):
        """GET /api/companies - Listar todas as empresas"""
        try:
            companies = self.company_service.get_all_companies()
            return jsonify({
                'success': True,
                'data': companies,
                'total': len(companies),
                'message': 'Empresas listadas com sucesso'
            })
            
        except DatabaseError as e:
            logger.error(f"Erro de banco ao buscar empresas: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno do servidor',
                'message': 'Falha ao acessar dados das empresas'
            }), 500
            
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar empresas: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500
    
    def get_company_by_id(self, company_id):
        """GET /api/companies/{id} - Buscar empresa específica"""
        try:
            company = self.company_service.get_company_by_id(company_id)
            
            if not company:
                return jsonify({
                    'success': False,
                    'message': f'Empresa {company_id} não encontrada'
                }), 404
            
            return jsonify({
                'success': True,
                'data': company,
                'message': 'Empresa encontrada com sucesso'
            })
            
        except ValidationError as e:
            return jsonify({
                'success': False,
                'error': 'Dados inválidos',
                'message': str(e)
            }), 400
            
        except NotFoundError as e:
            return jsonify({
                'success': False,
                'error': 'Não encontrado',
                'message': str(e)
            }), 404
            
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar empresa {company_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500
    
    def create_company(self):
        """POST /api/companies - Criar nova empresa"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Dados inválidos',
                    'message': 'Nenhum dado fornecido'
                }), 400
            
            company_id = self.company_service.create_company(data)
            
            return jsonify({
                'success': True,
                'data': {'id': company_id},
                'message': 'Empresa criada com sucesso'
            }), 201
            
        except ValidationError as e:
            return jsonify({
                'success': False,
                'error': 'Dados inválidos',
                'message': str(e)
            }), 400
            
        except Exception as e:
            logger.error(f"Erro ao criar empresa: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500
    
    def update_company(self, company_id):
        """PUT /api/companies/{id} - Atualizar empresa"""
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'error': 'Dados inválidos',
                    'message': 'Nenhum dado fornecido'
                }), 400
            
            updated = self.company_service.update_company(company_id, data)
            
            if not updated:
                return jsonify({
                    'success': False,
                    'message': f'Empresa {company_id} não encontrada'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Empresa atualizada com sucesso'
            })
            
        except ValidationError as e:
            return jsonify({
                'success': False,
                'error': 'Dados inválidos',
                'message': str(e)
            }), 400
            
        except NotFoundError as e:
            return jsonify({
                'success': False,
                'error': 'Não encontrado',
                'message': str(e)
            }), 404
            
        except Exception as e:
            logger.error(f"Erro ao atualizar empresa {company_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500
    
    def delete_company(self, company_id):
        """DELETE /api/companies/{id} - Remover empresa"""
        try:
            deleted = self.company_service.delete_company(company_id)
            
            if not deleted:
                return jsonify({
                    'success': False,
                    'message': f'Empresa {company_id} não encontrada'
                }), 404
            
            return jsonify({
                'success': True,
                'message': 'Empresa removida com sucesso'
            })
            
        except Exception as e:
            logger.error(f"Erro ao remover empresa {company_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500

    def get_companies_with_matches(self):
        """GET /api/companies/matches - Empresas com resumo de matches"""
        try:
            companies = self.company_service.get_companies_with_matches()
            return jsonify({
                'success': True,
                'data': companies,
                'total': len(companies),
                'message': 'Empresas com matches listadas com sucesso'
            })
            
        except DatabaseError as e:
            logger.error(f"Erro de banco ao buscar empresas com matches: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno do servidor',
                'message': 'Falha ao acessar dados das empresas'
            }), 500
            
        except Exception as e:
            logger.error(f"Erro inesperado ao buscar empresas com matches: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro inesperado no servidor'
            }), 500

    def get_companies_health(self):
        """GET /api/companies/health - Health check das empresas"""
        try:
            # Verificar se consegue acessar as empresas
            companies_count = len(self.company_service.get_all_companies())
            
            return jsonify({
                'success': True,
                'data': {
                    'status': 'healthy',
                    'total_companies': companies_count,
                    'service': 'CompanyService',
                    'timestamp': '2025-06-08T21:46:00Z'
                },
                'message': 'Serviço de empresas operacional'
            })
            
        except Exception as e:
            logger.error(f"Health check de empresas falhou: {e}")
            return jsonify({
                'success': False,
                'data': {
                    'status': 'unhealthy',
                    'error': str(e)
                },
                'message': 'Serviço de empresas com problemas'
            }), 503
    
    def get_companies_profile(self):
        """GET /api/companies/profile - Perfil das empresas"""
        try:
            companies = self.company_service.get_all_companies()
            
            # Calcular estatísticas de perfil
            total_companies = len(companies)
            if total_companies == 0:
                return jsonify({
                    'success': True,
                    'data': {
                        'total_companies': 0,
                        'message': 'Nenhuma empresa cadastrada'
                    }
                })
            
            # Análise básica dos perfis
            profile_data = {
                'total_companies': total_companies,
                'companies_with_description': sum(1 for c in companies if c.get('descricao_atividades')),
                'companies_with_capacity': sum(1 for c in companies if c.get('capacidade_tecnica')),
                'recent_companies': len([c for c in companies if c.get('created_at')]),
                'data_quality_score': round((
                    sum(1 for c in companies if c.get('descricao_atividades')) + 
                    sum(1 for c in companies if c.get('capacidade_tecnica'))
                ) / (total_companies * 2) * 100, 2) if total_companies > 0 else 0
            }
            
            return jsonify({
                'success': True,
                'data': profile_data,
                'message': f'Perfil de {total_companies} empresas analisado'
            })
            
        except Exception as e:
            logger.error(f"Erro ao gerar perfil de empresas: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro ao gerar perfil das empresas'
            }), 500
    
    def get_companies_statistics(self):
        """GET /api/companies/statistics - Estatísticas das empresas"""
        try:
            companies = self.company_service.get_all_companies()
            
            # Calcular estatísticas detalhadas
            total_companies = len(companies)
            if total_companies == 0:
                return jsonify({
                    'success': True,
                    'data': {
                        'total_companies': 0,
                        'message': 'Nenhuma empresa para calcular estatísticas'
                    }
                })
            
            statistics = {
                'total_companies': total_companies,
                'companies_by_status': {
                    'active': total_companies,  # Assumindo que todas estão ativas
                    'inactive': 0
                },
                'data_completeness': {
                    'with_description': sum(1 for c in companies if c.get('descricao_atividades')),
                    'with_capacity': sum(1 for c in companies if c.get('capacidade_tecnica')),
                    'with_contact': sum(1 for c in companies if c.get('email') or c.get('telefone'))
                },
                'quality_metrics': {
                    'completeness_rate': round(
                        sum(1 for c in companies if c.get('descricao_atividades') and c.get('capacidade_tecnica')) 
                        / total_companies * 100, 2
                    ) if total_companies > 0 else 0
                },
                'last_updated': '2025-06-08T21:46:00Z'
            }
            
            return jsonify({
                'success': True,
                'data': statistics,
                'message': f'Estatísticas de {total_companies} empresas calculadas'
            })
            
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas de empresas: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno',
                'message': 'Erro ao calcular estatísticas das empresas'
            }), 500 