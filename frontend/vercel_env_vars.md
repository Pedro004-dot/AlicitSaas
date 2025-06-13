# 🌐 Configurações da Vercel - Variáveis de Ambiente

## Variáveis Obrigatórias

### 🔗 Conexão com Backend
```bash
REACT_APP_API_BASE_URL=https://seu-app-backend.herokuapp.com/api
```

### 📋 Opcionais (Informações da App)
```bash
REACT_APP_VERSION=1.0.0
NODE_ENV=production
```

## 🔄 Como Configurar

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Selecionar seu Projeto** → **Settings**
3. **Environment Variables**
4. **Adicionar** as variáveis acima
5. **Importante**: Aplicar para **Production**, **Preview** e **Development**

## ⚠️ Importante

- **REACT_APP_API_BASE_URL**: Atualize com a URL real do Heroku após o deploy
- **Formato**: Deve terminar com `/api` (sem barra final)
- **HTTPS**: Use sempre HTTPS em produção

## 🔄 Sequência de Deploy

1. **Primeiro**: Deploy do backend no Heroku
2. **Segundo**: Anote a URL do Heroku (https://seu-app.herokuapp.com)
3. **Terceiro**: Configure `REACT_APP_API_BASE_URL=https://seu-app.herokuapp.com/api`
4. **Quarto**: Deploy do frontend na Vercel
5. **Quinto**: Anote a URL da Vercel
6. **Sexto**: Atualize `CORS_ORIGINS` no Heroku com a URL da Vercel 