# 🌐 Configurações da Vercel - Variáveis de Ambiente

## Variáveis Obrigatórias

### 🔗 Conexão com Backend
```bash
REACT_APP_API_BASE_URL=https://alicitsaas-production.up.railway.app/api
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

- **REACT_APP_API_BASE_URL**: ✅ **DEVE SER HTTPS** - `https://alicitsaas-production.up.railway.app/api`
- **Formato**: Deve terminar com `/api` (sem barra final)
- **HTTPS**: Use sempre HTTPS em produção (obrigatório para Vercel)
- **Fallback**: Se não configurado, usa automaticamente a URL HTTPS do Railway

## 🚨 **ATENÇÃO: ERRO COMUM**

❌ **NUNCA use HTTP:** `http://alicitsaas-production.up.railway.app/api`  
✅ **SEMPRE use HTTPS:** `https://alicitsaas-production.up.railway.app/api`

**O Vercel bloqueia requisições HTTP por segurança!**

## 🔄 Sequência de Deploy

1. **Primeiro**: Deploy do backend no Railway ✅ **CONCLUÍDO**
2. **Segundo**: URL do Railway: `https://alicitsaas-production.up.railway.app`
3. **Terceiro**: Configure `REACT_APP_API_BASE_URL=https://alicitsaas-production.up.railway.app/api` (opcional)
4. **Quarto**: Deploy do frontend na Vercel
5. **Quinto**: Anote a URL da Vercel
6. **Sexto**: CORS já configurado para `https://alicit-saas.vercel.app`

## 🔧 **Solução de Problemas**

Se você está vendo erros de "insecure content" ou "blocked", verifique:

1. **Variável de ambiente no Vercel** está usando HTTPS
2. **Não há cache** do navegador com URL HTTP antiga
3. **Redeploy** do frontend após mudanças 