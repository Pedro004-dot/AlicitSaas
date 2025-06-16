# #!/usr/bin/env python3
# """
# Script de entrada principal para o sistema Alicit - VERSÃO OFICIAL
# Executa a nova arquitetura modular refatorada com todos os blueprints
# """

# import sys
# import os
# import traceback
# from pathlib import Path

# # Adicionar src ao path para permitir imports
# project_root = Path(__file__).parent
# src_path = project_root / "src"
# sys.path.insert(0, str(src_path))

# def main():
#     """Função principal para executar versão oficial completa"""
#     try:
#         print("🚀 Iniciando Alicit Backend - VERSÃO OFICIAL COMPLETA")
#         print("=" * 60)
        
#         # Verificar se a pasta src existe
#         if not src_path.exists():
#             print(f"❌ ERRO: Pasta 'src' não encontrada em {src_path}")
#             return
        
#         print(f"✅ Pasta src encontrada: {src_path}")
        
#         # Carregar variáveis de ambiente primeiro
#         print("🔄 Carregando variáveis de ambiente...")
#         from src.config.env_loader import load_environment
#         load_environment()
        
#         # Tentar importar o app
#         print("🔄 Importando módulo app oficial...")
#         from src.app import create_development_app
#         print("✅ Módulo app importado com sucesso!")
        
#         # Criar aplicação
#         print("🔄 Criando aplicação com todos os blueprints...")
#         app = create_development_app()
#         print("✅ Aplicação criada com sucesso!")
        
#         # Configurações do servidor - usar porta 5002 para evitar conflito com AirPlay
#         host = '0.0.0.0'
#         port = 5002
        
#         print(f"🌐 Servidor: http://{host}:{port}")
#         print("💡 Health Check: http://localhost:5002/api/health")
#         print("📋 ARQUITETURA COMPLETA:")
#         print("  ✅ Companies: 5 endpoints (/api/companies/*)")
#         print("  ✅ Bids: 6 endpoints (/api/bids/*)")
#         print("  ✅ Matches: 2 endpoints (/api/matches/*)")
#         print("  ✅ Analysis: 12 endpoints (/api/licitacoes/*, /api/analyses/*)")
#         print("  ✅ System: 7 endpoints (/api/status/*, /api/config/*, etc)")
#         print("  📊 TOTAL: 32 endpoints migrados do monólito")
#         print("=" * 60)
#         print("🎯 Executando aplicação...")
        
#         # Iniciar servidor
#         app.run(host=host, port=port, debug=True, threaded=True)
        
#     except Exception as e:
#         print(f"❌ ERRO: {e}")
#         print("\n🔍 TRACEBACK COMPLETO:")
#         traceback.print_exc()
#         print("\n🔧 SUGESTÕES:")
#         print("1. Verifique se todas as dependências estão instaladas")
#         print("2. Execute: pip install flask flask-cors python-dotenv")
#         print("3. Verifique a estrutura de arquivos na pasta src/")
#         print("4. Verifique se os blueprints estão corretos")
#         sys.exit(1)

# if __name__ == '__main__':
#     main() 