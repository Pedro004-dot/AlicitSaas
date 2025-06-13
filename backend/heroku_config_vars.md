# 🚀 Configurações do Heroku - Variáveis de Ambiente

## Variáveis Obrigatórias

### 🔐 Segurança & Framework
```bash
SECRET_KEY=laewhvbwlhakldlh
FLASK_ENV=production
FLASK_DEBUG=False
```

### 🗄️ Banco de Dados Supabase
```bash
SUPABASE_URL=sua-supabase-url-aqui
SUPABASE_SERVICE_KEY=sua-service-key-aqui
SUPABASE_ANON_KEY=sua-anon-key-aqui
DATABASE_URL=sua-database-url-completa-aqui
```

### 🤖 APIs Externas
```bash
OPENAI_API_KEY=sua-openai-api-key-aqui
```

**⚠️ IMPORTANTE**: As chaves de API devem ser obtidas dos respectivos serviços:
- OpenAI: https://platform.openai.com/api-keys

### 🌐 CORS - CONFIGURAÇÃO PARA VERCEL
```bash
# URLs do Frontend Vercel (OBRIGATÓRIO)
CORS_ORIGINS=https://alicit-saas.vercel.app,https://www.alicit-saas.vercel.app
```

### 📊 Cache & Performance - Redis Railway
```bash
# Configurações do Redis (Railway)
REDIS_HOST=seu-redis-host-railway
REDIS_PORT=sua-porta-railway
REDIS_PASSWORD=sua-senha-railway
REDIS_DB=0
LOG_LEVEL=INFO
```

### ⚙️ Configurações de Aplicação
```bash
SIMILARITY_THRESHOLD_PHASE1=0.65
SIMILARITY_THRESHOLD_PHASE2=0.70
VECTORIZER_TYPE=sentence_transformers
CLEAR_MATCHES_BEFORE_REEVALUATE=true
PNCP_MAX_PAGES=5
PNCP_PAGE_SIZE=50
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=100
RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RAG_CACHE_TTL=3600
ENV=production
```

## 🔄 Como Configurar

1. **Heroku Dashboard**: https://dashboard.heroku.com/
2. **Selecionar seu App** → **Settings**
3. **Config Vars** → **Reveal Config Vars**
4. **Adicionar** cada variável acima

## ⚠️ Importante

- **SECRET_KEY**: Gere uma nova chave segura para produção
- **CORS_ORIGINS**: Atualize com a URL real da Vercel após o deploy
- **DATABASE_URL**: Use exatamente como está (já com a senha correta) 