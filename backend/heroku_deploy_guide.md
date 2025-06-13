# 🚀 Guia de Deploy no Heroku - Alicit Backend

## 📋 **Pré-requisitos**
- ✅ Frontend na Vercel: https://alicit-saas.vercel.app
- ✅ Redis no Railway (configurado)
- ✅ Banco Supabase (configurado)
- ✅ Conta no Heroku

## 🛠️ **Passo a Passo**

### **1. Instalar Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Ou baixar de: https://devcenter.heroku.com/articles/heroku-cli
```

### **2. Login no Heroku**
```bash
heroku login
```

### **3. Criar App no Heroku**
```bash
# Navegue para a pasta do projeto
cd /caminho/para/alicitSAAS

# Crie o app (escolha um nome único)
heroku create seu-app-name-backend

# Exemplo:
heroku create alicit-backend-api
```

### **4. Configurar Buildpacks**
```bash
heroku buildpacks:set heroku/python
```

### **5. Configurar Variáveis de Ambiente**

#### **🔐 Segurança & Framework**
```bash
heroku config:set SECRET_KEY=sua-chave-secreta-super-segura-aqui
heroku config:set FLASK_ENV=production
heroku config:set FLASK_DEBUG=False
```

#### **🗄️ Banco de Dados Supabase**
```bash
heroku config:set SUPABASE_URL=https://hdlowzlkwrboqfzjewom.supabase.co
heroku config:set SUPABASE_SERVICE_KEY=sua-service-key-real
heroku config:set SUPABASE_ANON_KEY=sua-anon-key-real
heroku config:set DATABASE_URL=sua-database-url-completa
```

#### **🌐 CORS (CRÍTICO!)**
```bash
heroku config:set CORS_ORIGINS=https://alicit-saas.vercel.app,https://www.alicit-saas.vercel.app
```

#### **📊 Redis Railway**
```bash
heroku config:set REDIS_HOST=seu-host-railway
heroku config:set REDIS_PORT=sua-porta-railway
heroku config:set REDIS_PASSWORD=sua-senha-railway
heroku config:set REDIS_DB=0
```

#### **🤖 APIs Externas**
```bash
heroku config:set OPENAI_API_KEY=sua-openai-key-real
```

#### **⚙️ Configurações da Aplicação**
```bash
heroku config:set LOG_LEVEL=INFO
heroku config:set ENV=production
heroku config:set SIMILARITY_THRESHOLD_PHASE1=0.65
heroku config:set SIMILARITY_THRESHOLD_PHASE2=0.70
heroku config:set VECTORIZER_TYPE=sentence_transformers
heroku config:set CLEAR_MATCHES_BEFORE_REEVALUATE=true
heroku config:set PNCP_MAX_PAGES=5
heroku config:set PNCP_PAGE_SIZE=50
heroku config:set RAG_CHUNK_SIZE=800
heroku config:set RAG_CHUNK_OVERLAP=100
heroku config:set RAG_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
heroku config:set RAG_CACHE_TTL=3600
```

### **6. Deploy do Código**
```bash
# Adicionar remote do Heroku (se não foi criado automaticamente)
heroku git:remote -a seu-app-name-backend

# Fazer deploy apenas da pasta backend
git subtree push --prefix=backend heroku main

# OU se estiver na pasta backend:
git push heroku main
```

### **7. Verificar Deploy**
```bash
# Ver logs
heroku logs --tail

# Abrir app
heroku open

# Verificar status
heroku ps
```

## 🔧 **Comandos Úteis**

### **Ver todas as variáveis configuradas:**
```bash
heroku config
```

### **Executar migrações (se necessário):**
```bash
heroku run python -c "from src.config.database import init_db; init_db()"
```

### **Abrir console Python no Heroku:**
```bash
heroku run python
```

### **Reiniciar a aplicação:**
```bash
heroku restart
```

## 🚨 **Solução de Problemas**

### **Se o deploy falhar:**
1. Verificar logs: `heroku logs --tail`
2. Verificar se `requirements.txt` está atualizado
3. Verificar se `Procfile` está correto
4. Verificar se todas as variáveis estão configuradas

### **Se o app não iniciar:**
1. Verificar se `DATABASE_URL` está correto
2. Verificar se `SECRET_KEY` está definido
3. Verificar se todas as dependências estão em `requirements.txt`

### **Se CORS não funcionar:**
1. Verificar se `CORS_ORIGINS` inclui as URLs corretas da Vercel
2. Não esquecer das variações com `www.`

## ✅ **Checklist Final**

- [ ] App criado no Heroku
- [ ] Todas as variáveis de ambiente configuradas
- [ ] CORS configurado com URLs da Vercel
- [ ] Redis Railway conectado
- [ ] Supabase conectado
- [ ] Deploy realizado com sucesso
- [ ] Logs mostram app funcionando
- [ ] Teste de conectividade do frontend

## 🔗 **URLs Importantes**

- **Heroku Dashboard**: https://dashboard.heroku.com/
- **Frontend Vercel**: https://alicit-saas.vercel.app
- **Documentação Heroku**: https://devcenter.heroku.com/

---

**Após o deploy, sua URL do backend será:**
`https://seu-app-name-backend.herokuapp.com`

**Atualize no frontend a variável:**
`REACT_APP_API_BASE_URL=https://seu-app-name-backend.herokuapp.com/api` 