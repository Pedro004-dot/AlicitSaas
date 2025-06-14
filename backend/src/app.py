"""
Aplicação Flask principal - Inicializador do Backend Alicit
Conexão direta com Supabase PostgreSQL (sem mock)
"""

import os
import sys
import logging
import traceback
from pathlib import Path
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Importar nova configuração de logging
from config.logging_config import setup_logging

# Carregar variáveis de ambiente
load_dotenv('config.env')

def create_app(config: dict = None) -> Flask:
    """
    Factory para criar aplicação Flask
    
    Args:
        config: Dicionário de configurações (opcional)
        
    Returns:
        Flask: Instância configurada da aplicação
    """
    app = Flask(__name__)
    
    _configure_app(app, config)
    _setup_cors(app)
    _initialize_database(app)
    _initialize_rag_service(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    
    return app

def _configure_app(app: Flask, config: dict = None) -> None:
    """Configurar aplicação com Supabase via variáveis de ambiente"""
    
    # Configurações usando variáveis de ambiente do config.env
    default_config = {
        'DEBUG': os.getenv('FLASK_DEBUG', 'True').lower() == 'true',
        'SECRET_KEY': os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
        # Configuração Supabase via variáveis de ambiente
        'SUPABASE_URL': os.getenv('SUPABASE_URL'),
        'SUPABASE_SERVICE_KEY': os.getenv('SUPABASE_SERVICE_KEY'),  # Para operações administrativas
        'SUPABASE_ANON_KEY': os.getenv('SUPABASE_ANON_KEY'),  # Para operações públicas
        'DATABASE_URL': os.getenv('DATABASE_URL'),
        'LOG_LEVEL': os.getenv('LOG_LEVEL', 'INFO'),
        'CORS_ORIGINS': os.getenv('CORS_ORIGINS', '*').split(','),
        'JSON_SORT_KEYS': False,
        'JSONIFY_PRETTYPRINT_REGULAR': True,
        # Configurações RAG
        'REDIS_HOST': os.getenv('REDIS_HOST', 'localhost'),
        'OPENAI_API_KEY': os.getenv('OPENAI_API_KEY'),
    }
    
    # Validar configurações essenciais
    required_configs = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'DATABASE_URL']
    missing_configs = []
    
    for config_key in required_configs:
        if not default_config.get(config_key):
            missing_configs.append(config_key)
    
    if missing_configs:
        raise ValueError(f"❌ Configurações obrigatórias não encontradas: {', '.join(missing_configs)}")
    
    app.config.update(default_config)
    
    if config:
        app.config.update(config)
    
    # Log das configurações carregadas (sem expor dados sensíveis)
    app.logger.info("🔧 Configurações carregadas do config.env:")
    app.logger.info(f"  - SUPABASE_URL: {app.config['SUPABASE_URL']}")
    app.logger.info(f"  - DATABASE_URL: {'✅ Configurado' if app.config['DATABASE_URL'] else '❌ Não configurado'}")
    app.logger.info(f"  - SUPABASE_SERVICE_KEY: {'✅ Configurado' if app.config['SUPABASE_SERVICE_KEY'] else '❌ Não configurado'}")
    app.logger.info(f"  - REDIS_HOST: {app.config['REDIS_HOST']}")
    app.logger.info(f"  - LOG_LEVEL: {app.config['LOG_LEVEL']}")
    app.logger.info(f"  - DEBUG: {app.config['DEBUG']}")

def _initialize_database(app: Flask) -> None:
    """Inicializar pool de conexões PostgreSQL"""
    try:
        # As variáveis de ambiente já foram carregadas pelo env_loader
        # Vamos confirmar que estão disponíveis
        database_url = app.config.get('DATABASE_URL')
        supabase_url = app.config.get('SUPABASE_URL')
        
        if not database_url:
            raise ValueError("DATABASE_URL não encontrada nas configurações")
        
        if not supabase_url:
            raise ValueError("SUPABASE_URL não encontrada nas configurações")
        
        # Import tardio e defensivo do database manager
        from config.database import get_db_manager
        
        # Obter instância com lazy loading
        app.logger.info("🔄 Inicializando DatabaseManager...")
        db_manager = get_db_manager()
        
        # Verificar conectividade
        health_status = db_manager.get_health_status()
        if health_status['overall'] == 'healthy':
            app.logger.info("✅ DatabaseManager inicializado com sucesso!")
            app.logger.info(f"🔗 PostgreSQL: {health_status['connections']['postgresql']['status']}")
        else:
            app.logger.warning("⚠️ DatabaseManager com problemas de conectividade")
            app.logger.warning(f"❌ Status: {health_status['connections']['postgresql'].get('error', 'Erro desconhecido')}")
            
        # Configurar encerramento gracioso do pool
        import atexit
        atexit.register(db_manager.close_pool)
        
    except ImportError as e:
        app.logger.error(f"❌ ERRO de importação: {e}")
        app.logger.error("💡 Verifique se o arquivo config/database.py existe e está correto")
        raise e
    except Exception as e:
        app.logger.error(f"❌ ERRO ao inicializar DatabaseManager: {e}")
        app.logger.error("💡 Verificando possíveis soluções:")
        app.logger.error("   1. Verifique conexão de internet")
        app.logger.error("   2. Verifique se as variáveis DATABASE_URL e SUPABASE_URL estão no config.env")
        app.logger.error("   3. Teste a conectividade com o Supabase")
        
        # Modo de desenvolvimento sem banco
        app.logger.warning("⚠️ MODO DESENVOLVIMENTO: Iniciando sem banco de dados")
        app.logger.warning("💡 Alguns endpoints que dependem do banco podem falhar")

def _initialize_rag_service(app: Flask) -> None:
    """Preparar RAG Service para inicialização lazy (sob demanda)"""
    try:
        app.logger.info("🔄 Preparando RAGService para inicialização lazy...")
        
        # 1. Validar pré-requisitos (OpenAI API Key)
        openai_api_key = app.config.get('OPENAI_API_KEY')
        if not openai_api_key:
            app.logger.warning("❌ OPENAI_API_KEY não encontrada. RAG será inicializado sob demanda.")
            app.rag_service = None
            return

        # 2. Armazenar configurações para inicialização lazy
        app.rag_config = {
            'openai_api_key': openai_api_key,
            'supabase_url': app.config.get('SUPABASE_URL'),
            'supabase_key': app.config.get('SUPABASE_SERVICE_KEY'),
            'redis_host': app.config.get('REDIS_HOST', 'localhost')
        }
        
        # 3. Marcar que RAG está pronto para ser inicializado
        app.rag_service = None  # Será inicializado na primeira chamada
        app.rag_initialized = False
        app.logger.info("✅ RAGService configurado para inicialização lazy!")
        
    except Exception as e:
        app.logger.error(f"❌ ERRO ao preparar RAGService: {e}")
        app.logger.warning("⚠️ RAG endpoints estarão desativados.")
        app.rag_service = None
        app.rag_initialized = False

def get_rag_service(app):
    """Inicializar RAG service sob demanda (lazy loading)"""
    if hasattr(app, 'rag_initialized') and app.rag_initialized:
        return getattr(app, 'rag_service', None)
    
    if not hasattr(app, 'rag_config'):
        return None
        
    try:
        app.logger.info("🔄 Inicializando RAGService sob demanda...")
        
        # Importar e inicializar componentes pesados agora
        from services.rag_service import RAGService
        from config.database import get_db_manager
        from core.unified_document_processor import UnifiedDocumentProcessor

        db_manager = get_db_manager()
        unified_processor = UnifiedDocumentProcessor(
            db_manager=db_manager,
            supabase_url=app.rag_config['supabase_url'],
            supabase_key=app.rag_config['supabase_key']
        )

        # Criar a instância do serviço
        rag_service = RAGService(
            db_manager=db_manager,
            unified_processor=unified_processor,
            openai_api_key=app.rag_config['openai_api_key'],
            redis_host=app.rag_config['redis_host']
        )
        
        app.rag_service = rag_service
        app.rag_initialized = True
        app.logger.info("✅ RAGService inicializado sob demanda!")
        return rag_service
        
    except Exception as e:
        app.logger.error(f"❌ ERRO ao inicializar RAGService sob demanda: {e}")
        app.rag_service = None
        app.rag_initialized = False
        return None

def _setup_cors(app: Flask) -> None:
    """Configurar CORS para permitir requisições do frontend"""
    # Configurar trailing slashes para evitar redirects 308
    app.url_map.strict_slashes = False
    
    # Usar origens configuradas nas variáveis de ambiente
    cors_origins = app.config.get('CORS_ORIGINS', ['*'])
    app.logger.info(f"🔒 CORS configurado para origens: {cors_origins}")
    
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

def _register_blueprints(app: Flask) -> None:
    """Registrar todos os blueprints da aplicação"""
    
    try:
        # Imports absolutos para blueprints
        from routes.company_routes import company_routes
        from routes.bid_routes import bid_routes
        from routes.match_routes import match_routes
        from routes.system_routes import system_routes
        from routes.rag_routes import create_rag_routes # ✅ NOVO
  
        # Registrar blueprints
        app.register_blueprint(company_routes)
        app.register_blueprint(bid_routes)
        app.register_blueprint(match_routes)
    
        app.register_blueprint(system_routes)
        
        # Registrar rotas RAG com lazy loading
        if hasattr(app, 'rag_config'):
            # Criar blueprint que usa lazy loading
            from routes.rag_routes import create_rag_routes_lazy
            rag_bp = create_rag_routes_lazy()
            app.register_blueprint(rag_bp)
            app.logger.info("  ✅ RAG: 4 endpoints (/api/rag/*) - lazy loading")
        else:
            app.logger.warning("  ❌ RAG: rotas desativadas devido a configuração insuficiente.")
        
        
        # Log resumo
        app.logger.info("🚀 Aplicação modular inicializada:")
        app.logger.info("  ✅ Companies: 8 endpoints (/api/companies/*)")
        app.logger.info("  ✅ Bids: 10 endpoints (/api/bids/*)")
        app.logger.info("  ✅ Matches: 4 endpoints (/api/matches/*)")
        app.logger.info("  ✅ System: 7 endpoints (/api/status/*, /api/config/*, etc)")
        app.logger.info("  🆕 Chat: 8 endpoints (/api/licitacoes/*/chat, /api/admin/rag)")
        app.logger.info("  📊 TOTAL: 49 endpoints ativos")
        
        app.logger.info("✅ Todos os blueprints registrados com sucesso!")
        
        # Rota para servir arquivos de documentos
        @app.route('/storage/licitacoes/<licitacao_id>/<filename>')
        def serve_document(licitacao_id, filename):
            """Serve documentos da pasta storage/licitacoes/{licitacao_id}"""
            try:
                storage_path = os.path.join(os.getcwd(), 'storage', 'licitacoes', licitacao_id)
                return send_from_directory(storage_path, filename)
            except Exception as e:
                return jsonify({'error': f'Arquivo não encontrado: {e}'}), 404
        
        # Rota de health check
        @app.route('/health')
        def health_check():
            return jsonify({'status': 'healthy', 'message': 'API funcionando corretamente'})
        
    except ImportError as e:
        app.logger.error(f"❌ Erro ao importar blueprints: {e}")
        app.logger.error("💡 Verifique se todos os arquivos de rotas existem")
        raise e

def _register_error_handlers(app: Flask) -> None:
    """Registrar handlers globais de erro"""
    try:
        from middleware.error_handler import register_error_handlers
        register_error_handlers(app)
        app.logger.info("✅ Error handlers registrados!")
    except ImportError:
        # Handler básico
        @app.errorhandler(404)
        def not_found(error):
            return {'error': 'Endpoint não encontrado'}, 404
            
        @app.errorhandler(500)
        def internal_error(error):
            return {'error': 'Erro interno do servidor'}, 500

def _setup_logging(app: Flask) -> None:
    """Configurar sistema de logging (agora é feito no main)"""
    pass # Mantido para não quebrar a chamada, mas a lógica está no main

def _create_directories() -> None:
    """Criar diretórios necessários"""
    directories = ['logs', 'uploads', 'temp']
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

def main():
    """Função principal para executar o backend Alicit"""
    try:
        print("🚀 Iniciando Alicit Backend - CONEXÃO DIRETA SUPABASE")
        print("=" * 60)
        
        # Configurar logging primeiro
        setup_logging()
        
        # Criar diretórios
        _create_directories()
        
        # Carregar configurações de ambiente se disponível
        try:
            from config.env_loader import load_environment
            load_environment()
            print("✅ Configurações de ambiente carregadas")
        except:
            print("⚠️ env_loader não disponível - usando config padrão")
        
        # Criar aplicação
        print("🔄 Criando aplicação...")
        app = create_app()
        print("✅ Aplicação criada com sucesso!")
        
        # Configurar servidor
        host = '0.0.0.0'
        port = 5002
        
        print(f"🌐 Servidor: http://{host}:{port}")
        print("💡 Health Check: http://localhost:5002/api/health")
        print("🔗 Supabase: https://hdlowzlkwrboqfzjewom.supabase.co")
        print("📋 41 endpoints ativos")
        print("🗄️ Conexão: PostgreSQL via Supabase")
        print("=" * 60)
        print("🎯 Iniciando servidor...")
        
        # Iniciar servidor
        app.run(host=host, port=port, debug=True, threaded=True)
        
    except Exception as e:
        print(f"❌ ERRO: {e}")
        print("\n🔍 TRACEBACK:")
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main() 