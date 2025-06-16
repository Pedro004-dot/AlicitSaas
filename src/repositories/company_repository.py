"""
Repository específico para empresas
Operações CRUD e consultas específicas para a tabela 'empresas'
"""
from typing import List, Dict, Any, Optional
from .base_repository import BaseRepository
import logging

logger = logging.getLogger(__name__)

class CompanyRepository(BaseRepository):
    """Repository para operações com a tabela empresas"""
    
    @property
    def table_name(self) -> str:
        return "empresas"
    
    @property
    def primary_key(self) -> str:
        return "id"
    
    def find_by_cnpj(self, cnpj: str) -> Optional[Dict[str, Any]]:
        """Buscar empresa por CNPJ"""
        companies = self.find_by_filters({'cnpj': cnpj}, limit=1)
        return companies[0] if companies else None
    
    def search_by_name(self, search_term: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Buscar empresas por nome fantasia ou razão social"""
        query = """
            SELECT * FROM empresas 
            WHERE nome_fantasia ILIKE %s 
               OR razao_social ILIKE %s
            ORDER BY nome_fantasia
            LIMIT %s
        """
        search_pattern = f"%{search_term}%"
        return self.execute_custom_query(query, (search_pattern, search_pattern, limit))
    
    def search_by_keywords(self, keywords: List[str], limit: int = 50) -> List[Dict[str, Any]]:
        """Buscar empresas por palavras-chave nos serviços/produtos"""
        if not keywords:
            return []
        
        # Construir condições para cada palavra-chave
        keyword_conditions = []
        params = []
        
        for keyword in keywords:
            keyword_pattern = f"%{keyword}%"
            keyword_conditions.append("""
                (descricao_servicos_produtos ILIKE %s 
                 OR palavras_chave::text ILIKE %s
                 OR setor_atuacao ILIKE %s)
            """)
            params.extend([keyword_pattern, keyword_pattern, keyword_pattern])
        
        query = f"""
            SELECT *, 
                   (CASE 
                    WHEN nome_fantasia ILIKE ANY(ARRAY[{','.join(['%s'] * len(keywords))}]) THEN 3
                    WHEN descricao_servicos_produtos ILIKE ANY(ARRAY[{','.join(['%s'] * len(keywords))}]) THEN 2
                    ELSE 1
                   END) as relevance_score
            FROM empresas 
            WHERE {' OR '.join(keyword_conditions)}
            ORDER BY relevance_score DESC, nome_fantasia
            LIMIT %s
        """
        
        # Adicionar keywords para os ARRAY[]
        keyword_patterns = [f"%{kw}%" for kw in keywords]
        all_params = keyword_patterns + keyword_patterns + params + [limit]
        
        return self.execute_custom_query(query, tuple(all_params))
    
    def get_companies_by_sector(self, sector: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Buscar empresas por setor de atuação"""
        return self.find_by_filters({'setor_atuacao': sector}, limit=limit)
    
    def get_companies_statistics(self) -> Dict[str, Any]:
        """Obter estatísticas das empresas"""
        stats_query = """
            SELECT 
                COUNT(*) as total_empresas,
                COUNT(DISTINCT setor_atuacao) as total_setores,
                COUNT(CASE WHEN cnpj IS NOT NULL THEN 1 END) as empresas_com_cnpj,
                MAX(created_at) as ultima_empresa_criada,
                MIN(created_at) as primeira_empresa_criada
            FROM empresas
        """
        
        result = self.execute_custom_query(stats_query)
        if result:
            stats = result[0]
            
            # Buscar setores mais comuns
            sectors_query = """
                SELECT setor_atuacao, COUNT(*) as quantidade
                FROM empresas 
                WHERE setor_atuacao IS NOT NULL
                GROUP BY setor_atuacao
                ORDER BY quantidade DESC
                LIMIT 10
            """
            
            stats['setores_principais'] = self.execute_custom_query(sectors_query)
            return stats
        
        return {
            'total_empresas': 0,
            'total_setores': 0,
            'empresas_com_cnpj': 0,
            'setores_principais': []
        }
    
    def get_companies_with_keywords_count(self) -> List[Dict[str, Any]]:
        """Obter empresas com quantidade de palavras-chave"""
        query = """
            SELECT id, nome_fantasia, razao_social,
                   CASE 
                       WHEN palavras_chave IS NULL THEN 0
                       ELSE jsonb_array_length(palavras_chave)
                   END as total_keywords
            FROM empresas
            ORDER BY total_keywords DESC, nome_fantasia
        """
        
        return self.execute_custom_query(query)
    
    def update_keywords(self, company_id: str, keywords: List[str]) -> Optional[Dict[str, Any]]:
        """Atualizar palavras-chave de uma empresa"""
        import json
        return self.update(company_id, {'palavras_chave': json.dumps(keywords)})
    
    def bulk_create(self, companies_data: List[Dict[str, Any]]) -> List[str]:
        """Criar múltiplas empresas em uma transação"""
        created_ids = []
        
        with self.db_manager.get_transaction() as conn:
            with conn.cursor() as cursor:
                for company_data in companies_data:
                    # Adicionar timestamps
                    from datetime import datetime
                    if 'created_at' not in company_data:
                        company_data['created_at'] = datetime.now()
                    if 'updated_at' not in company_data:
                        company_data['updated_at'] = datetime.now()
                    
                    # Construir INSERT
                    columns = list(company_data.keys())
                    placeholders = ['%s'] * len(columns)
                    values = list(company_data.values())
                    
                    query = f"""
                        INSERT INTO empresas ({', '.join(columns)})
                        VALUES ({', '.join(placeholders)})
                        RETURNING id
                    """
                    
                    cursor.execute(query, values)
                    created_ids.append(cursor.fetchone()[0])
        
        logger.info(f"Criadas {len(created_ids)} empresas em lote")
        return created_ids 