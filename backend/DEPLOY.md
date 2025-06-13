# 🚀 Guia de Deploy para Produção

Este documento explica como fazer deploy da aplicação Alicit para produção usando Vercel (frontend) e Heroku (backend).

## 📋 Pré-requisitos

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Heroku](https://heroku.com)
- [ ] Git configurado
- [ ] Heroku CLI instalado
- [ ] Supabase configurado (já funcionando)

## 🎯 Arquitetura de Produção

```
Frontend (React) ─── Vercel ───► Internet
                                    │
Backend (Flask) ──── Heroku ───────┘
        │
Database ─────── Supabase ─────────┘
```

---

## 🚀 PARTE 1: Deploy do Backend no Heroku

### 1.1 Preparação

```bash
# 1. Login no Heroku
heroku login

# 2. Criar aplicação no Heroku
heroku create seu-app-alicit-backend

# 3. Navegar para o diretório raiz do projeto
cd /Users/pedrotorrezani/Documents/Programacao/alicit
```

### 1.2 Configurar Variáveis de Ambiente

No **Heroku Dashboard** → **Settings** → **Config Vars**, adicione:

```bash
# Configurações essenciais
SECRET_KEY=sua-chave-super-secreta-aqui
FLASK_ENV=production
FLASK_DEBUG=False

# Supabase (copie do seu config.env)
SUPABASE_URL=https://hdlowzlkwrboqfzjewom.supabase.co
SUPABASE_SERVICE_KEY=sua-service-key-aqui
SUPABASE_ANON_KEY=sua-anon-key-aqui  
DATABASE_URL=sua-database-url-aqui

# APIs externas
OPENAI_API_KEY=sua-openai-key-aqui

# CORS (atualize depois com URL real da Vercel)
CORS_ORIGINS=*

# Outras configurações
LOG_LEVEL=INFO
VECTORIZER_TYPE=sentence_transformers
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=100
```

### 1.3 Deploy

```bash
# 1. Adicionar remoto do Heroku
heroku git:remote -a seu-app-alicit-backend

# 2. Fazer deploy
git add .
git commit -m "Setup for production deployment"
git push heroku main

# 3. Verificar logs
heroku logs --tail

# 4. Abrir aplicação
heroku open
```

### 1.4 Verificar Deploy

Teste se a API está funcionando:
```bash
curl https://seu-app-alicit-backend.herokuapp.com/health
```

---

## 🌐 PARTE 2: Deploy do Frontend na Vercel

### 2.1 Preparação

```bash
# 1. Navegar para o frontend
cd frontend

# 2. Instalar Vercel CLI (se necessário)
npm i -g vercel

# 3. Login na Vercel
vercel login
```

### 2.2 Deploy

```bash
# 1. Deploy inicial
vercel

# Configurações durante o deploy:
# ? Set up and deploy "frontend"? Y
# ? Which scope? [sua conta]
# ? Link to existing project? N
# ? What's your project's name? alicit-frontend
# ? In which directory is your code located? ./
# ? Want to override the settings? N

# 2. Deploy para produção
vercel --prod
```

### 2.3 Configurar Variáveis de Ambiente na Vercel

Na **Vercel Dashboard** → **Project Settings** → **Environment Variables**:

```bash
REACT_APP_API_BASE_URL=https://seu-app-alicit-backend.herokuapp.com/api
```

### 2.4 Redeploy com Variáveis

```bash
vercel --prod
```

---

## 🔧 PARTE 3: Ajustes Finais

### 3.1 Atualizar CORS no Backend

No **Heroku Dashboard**, atualize a variável `CORS_ORIGINS`:

```bash
CORS_ORIGINS=https://seu-frontend.vercel.app,https://www.seu-frontend.vercel.app
```

Redeploy o backend:
```bash
git commit --allow-empty -m "Update CORS origins"
git push heroku main
```

### 3.2 Verificar Funcionalidade

1. **Frontend**: Abra https://seu-frontend.vercel.app
2. **Backend**: Teste https://seu-app-alicit-backend.herokuapp.com/health
3. **Integração**: Teste se o frontend consegue buscar dados do backend

---

## 🐛 Troubleshooting

### Problemas Comuns

#### ❌ Backend não inicia
```bash
# Verificar logs
heroku logs --tail -a seu-app-alicit-backend

# Possíveis soluções:
# 1. Verificar se todas as variáveis de ambiente estão configuradas
# 2. Verificar se o Procfile está correto
# 3. Verificar se requirements.txt tem todas as dependências
```

#### ❌ Frontend não conecta com backend
```bash
# 1. Verificar variável REACT_APP_API_BASE_URL na Vercel
# 2. Verificar CORS no backend
# 3. Verificar se backend está funcionando
```

#### ❌ Erro de CORS
```bash
# No Heroku, configurar:
CORS_ORIGINS=https://seu-frontend.vercel.app
```

### 📱 Comandos Úteis

```bash
# Heroku
heroku logs --tail -a seu-app
heroku restart -a seu-app
heroku config -a seu-app

# Vercel  
vercel logs
vercel env ls
vercel redeploy
```

---

## 🔍 Monitoramento

### Health Checks

- **Backend**: `https://seu-app-backend.herokuapp.com/health`
- **Frontend**: `https://seu-frontend.vercel.app`

### Logs

- **Heroku**: `heroku logs --tail`
- **Vercel**: Dashboard → Functions → View Function Logs

---

## 📝 Checklist Final

- [ ] Backend no Heroku funcionando
- [ ] Frontend na Vercel funcionando  
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Health checks passando
- [ ] Conexão frontend-backend funcionando
- [ ] Banco Supabase conectado
- [ ] Documentos e uploads funcionando

---

## 🎉 Pronto!

Sua aplicação agora está rodando em produção:

- **Frontend**: https://seu-frontend.vercel.app
- **Backend**: https://seu-app-backend.herokuapp.com
- **Dashboard**: https://dashboard.heroku.com e https://vercel.com/dashboard

### URLs Importantes

- Frontend: Vercel fornecerá automaticamente
- Backend: `https://seu-app-alicit-backend.herokuapp.com`
- Health Check: `https://seu-app-alicit-backend.herokuapp.com/health` 