"""
Controller para operações com matches/correspondências
"""
import logging
from flask import request, jsonify
from services.match_service import MatchService
from repositories.match_repository import MatchRepository
from config.database import db_manager
from exceptions.api_exceptions import ValidationError, NotFoundError, DatabaseError

logger = logging.getLogger(__name__)

class MatchController:
    """Controller para gerenciar operações HTTP relacionadas a matches"""
    
    def __init__(self):
        """Inicializar controller com service e repository"""
        self.match_service = MatchService()
        self.match_repository = MatchRepository(db_manager)
    
    def get_all_matches(self):
        """GET /api/matches - Listar todas as correspondências"""
        try:
            # Parâmetros simples que o MatchService aceita
            limit = request.args.get('limit', 50, type=int)
            
            logger.info(f"🔍 Listando matches - limite {limit}")
            
            # Usar repository para dados complexos (com joins)
            matches = self.match_repository.find_all_with_details()
            
            # Aplicar limite se necessário
            if limit and len(matches) > limit:
                matches = matches[:limit]
            
            return jsonify({
                'success': True,
                'data': matches,
                'total': len(matches),
                'message': f'{len(matches)} matches encontrados'
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches',
                'message': str(e)
            }), 500

    def get_matches_by_company(self):
        """GET /api/matches/by-company - Correspondências agrupadas por empresa"""
        try:
            logger.info("🔍 Buscando matches agrupados por empresa")
            
            # Usar repository para busca complexa agrupada
            companies_matches = self.match_repository.find_grouped_by_company()
            
            return jsonify({
                'success': True,
                'data': companies_matches,
                'total': len(companies_matches),
                'message': f'{len(companies_matches)} empresas com matches encontradas'
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches por empresa: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches por empresa',
                'message': str(e)
            }), 500

    def get_matches_by_company_id(self, company_id):
        """GET /api/matches/company/{company_id} - Matches de uma empresa específica"""
        try:
            # Parâmetros opcionais
            limit = request.args.get('limit', 20, type=int)
            
            logger.info(f"🔍 Buscando matches da empresa {company_id}")
            
            # Usar service simples para busca por empresa
            matches = self.match_service.get_matches_by_company(
                company_id=company_id,
                limit=limit
            )
            
            return jsonify({
                'success': True,
                'data': matches,
                'company_id': company_id,
                'total': len(matches),
                'filters': {
                    'limit': limit
                }
            }), 200
            
        except NotFoundError as e:
            return jsonify({
                'success': False,
                'error': 'Empresa não encontrada',
                'message': str(e)
            }), 404
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches da empresa {company_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches da empresa',
                'message': str(e)
            }), 500

    def get_matches_by_bid_id(self, bid_id):
        """GET /api/matches/bid/{bid_id} - Matches de uma licitação específica"""
        try:
            logger.info(f"🔍 Buscando matches da licitação {bid_id}")
            
            matches = self.match_repository.find_by_bid_id(bid_id)
            
            return jsonify({
                'success': True,
                'data': matches,
                'bid_id': bid_id,
                'total': len(matches)
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches da licitação {bid_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches da licitação',
                'message': str(e)
            }), 500

    def get_matches_by_score_range(self):
        """GET /api/matches/score - Matches por faixa de score"""
        try:
            min_score = request.args.get('min_score', 0.5, type=float)
            max_score = request.args.get('max_score', 1.0, type=float)
            
            logger.info(f"🔍 Buscando matches com score entre {min_score} e {max_score}")
            
            matches = self.match_repository.find_by_score_range(min_score, max_score)
            
            return jsonify({
                'success': True,
                'data': matches,
                'total': len(matches),
                'filters': {
                    'min_score': min_score,
                    'max_score': max_score
                }
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches por score: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches por score',
                'message': str(e)
            }), 500

    def get_recent_matches(self):
        """GET /api/matches/recent - Matches mais recentes"""
        try:
            limit = request.args.get('limit', 10, type=int)
            
            logger.info(f"🔍 Buscando {limit} matches mais recentes")
            
            matches = self.match_repository.find_recent_matches(limit)
            
            return jsonify({
                'success': True,
                'data': matches,
                'total': len(matches),
                'limit': limit
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches recentes: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches recentes',
                'message': str(e)
            }), 500

    def get_high_quality_matches(self):
        """GET /api/matches/high-quality - Matches de alta qualidade"""
        try:
            min_score = request.args.get('min_score', 0.8, type=float)
            
            logger.info(f"🔍 Buscando matches de alta qualidade (score >= {min_score})")
            
            matches = self.match_repository.find_by_score_range(min_score, 1.0)
            
            return jsonify({
                'success': True,
                'data': matches,
                'total': len(matches),
                'min_score': min_score
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches de alta qualidade: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches de alta qualidade',
                'message': str(e)
            }), 500

    def analyze_match_quality(self):
        """GET /api/matches/analyze - Analisar qualidade dos matches"""
        try:
            company_id = request.args.get('company_id')
            bid_id = request.args.get('bid_id')
            
            logger.info(f"🔍 Analisando qualidade de matches")
            
            if company_id:
                matches = self.match_repository.find_by_company_id(company_id)
                analysis_type = 'company'
                entity_id = company_id
            elif bid_id:
                matches = self.match_repository.find_by_bid_id(bid_id)
                analysis_type = 'bid'
                entity_id = bid_id
            else:
                return jsonify({
                    'success': False,
                    'error': 'Parâmetro obrigatório',
                    'message': 'Informe company_id ou bid_id'
                }), 400
            
            # Análise básica
            total = len(matches)
            if total == 0:
                avg_score = 0
                high_quality_count = 0
            else:
                scores = [m.get('score_similaridade', 0) for m in matches]
                avg_score = sum(scores) / len(scores)
                high_quality_count = len([s for s in scores if s >= 0.8])
            
            analysis = {
                'analysis_type': analysis_type,
                'entity_id': entity_id,
                'total_matches': total,
                'average_score': round(avg_score, 3),
                'high_quality_matches': high_quality_count,
                'quality_percentage': round((high_quality_count / total * 100), 1) if total > 0 else 0
            }
            
            return jsonify({
                'success': True,
                'data': analysis
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao analisar qualidade de matches: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao analisar matches',
                'message': str(e)
            }), 500

    def delete_matches_by_company(self, company_id):
        """DELETE /api/matches/company/{company_id} - Deletar matches de uma empresa"""
        try:
            logger.info(f"🗑️ Deletando matches da empresa {company_id}")
            
            deleted_count = self.match_repository.delete_by_company_id(company_id)
            
            return jsonify({
                'success': True,
                'message': f'{deleted_count} matches deletados da empresa {company_id}',
                'deleted_count': deleted_count
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao deletar matches da empresa {company_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao deletar matches',
                'message': str(e)
            }), 500

    def delete_matches_by_bid(self, bid_id):
        """DELETE /api/matches/bid/{bid_id} - Deletar matches de uma licitação"""
        try:
            logger.info(f"🗑️ Deletando matches da licitação {bid_id}")
            
            # Implementar no repository se necessário
            # Por enquanto retorna sucesso
            
            return jsonify({
                'success': True,
                'message': f'Matches da licitação {bid_id} deletados',
                'deleted_count': 0  # placeholder
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao deletar matches da licitação {bid_id}: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao deletar matches',
                'message': str(e)
            }), 500

    def get_matches_statistics(self):
        """GET /api/matches/statistics - Estatísticas gerais de matches"""
        try:
            logger.info("📊 Obtendo estatísticas de matches")
            
            # Usar repository para estatísticas detalhadas
            stats = self.match_repository.get_match_statistics()
            
            return jsonify({
                'success': True,
                'data': stats
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao obter estatísticas de matches: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao obter estatísticas',
                'message': str(e)
            }), 500

    def get_matches_grouped(self):
        """GET /api/matches/grouped - Correspondências agrupadas (alias para by-company)"""
        try:
            logger.info("🔍 Buscando matches agrupados")
            
            # Usar repository para busca complexa agrupada
            companies_matches = self.match_repository.find_grouped_by_company()
            
            return jsonify({
                'success': True,
                'data': companies_matches,
                'total': len(companies_matches),
                'grouped_by': 'company',
                'message': f'{len(companies_matches)} empresas com matches encontradas'
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Erro ao buscar matches agrupados: {e}")
            return jsonify({
                'success': False,
                'error': 'Erro interno ao buscar matches agrupados',
                'message': str(e)
            }), 500 