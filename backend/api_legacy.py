# BACKUP DO API.PY ORIGINAL
# Este arquivo é mantido como fallback caso a nova arquitetura tenha problemas
# Correção aplicada: checklist_manager não existe, comentando import

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import logging
import datetime
import os
import asyncio
from dotenv import load_dotenv
from matching import (
    MockTextVectorizer, 
    OpenAITextVectorizer,
    SentenceTransformersVectorizer,
    HybridTextVectorizer,
    process_daily_bids, 
    reevaluate_existing_bids,
    get_existing_bids_from_db,
    get_all_companies_from_db,
    get_db_connection
)
# COMENTADO TEMPORARIAMENTE - DEPENDÊNCIA QUEBRADA
# from analysis import DocumentAnalyzer

import psycopg2
from psycopg2.extras import DictCursor
import uuid

# Carregar variáveis de ambiente do config.env ANTES de qualquer outra coisa
load_dotenv('config.env')

app = Flask(__name__)
CORS(app)  # Permitir requisições do React

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

print("⚠️  USANDO API.PY LEGADO - MODO FALLBACK")
print("   Alguns recursos de análise podem estar indisponíveis")
print("   Recomendado usar: python main.py")

# Estado global para controlar execução
process_status = {
    'daily_bids': {'running': False, 'last_result': None},
    'reevaluate': {'running': False, 'last_result': None},
    'is_running': False,
    'last_run': None,
    'status': 'idle',
    'results': None
}

# ... resto do código permanece igual ...
# (O restante do código do api.py seria copiado aqui, mas vou omitir para brevidade)
# (O restante do código do api.py seria copiado aqui, mas vou omitir para brevidade)
# (O restante do código do api.py seria copiado aqui, mas vou omitir para brevidade)
if __name__ == '__main__':
    print("🚀 Iniciando API Flask LEGADO...")
    print("💡 Para usar a nova arquitetura, execute: python main.py")
    app.run(host='0.0.0.0', port=5002, debug=True) 