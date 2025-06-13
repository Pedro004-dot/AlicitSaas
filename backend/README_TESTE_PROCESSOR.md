# 🧪 Sistema de Teste e Validação - Unified Document Processor

Este sistema permite validar e testar todas as funcionalidades do `UnifiedDocumentProcessor` de forma interativa e automatizada.

## 🚀 Como Usar

### 1. **Demo Interativo Completo** (Recomendado)
```bash
python test_unified_processor.py
```
**O que faz:**
- ✅ Valida todas as configurações (banco, Supabase, bucket, diretórios)
- 📋 Lista licitações disponíveis no banco
- 🎯 Permite escolher uma licitação para teste
- 🧪 Executa processamento completo com feedback em tempo real

### 2. **Teste Rápido de Validação**
```bash
python test_unified_processor.py rapido
```
**O que faz:**
- ⚡ Validação rápida de configuração
- 📊 Status de todas as conexões
- 📋 Preview de licitações disponíveis
- 🕒 Execução em ~5 segundos

### 3. **Teste de Licitação Específica**
```bash
python test_unified_processor.py licitacao "SEU_ID_AQUI"
```
**O que faz:**
- 🎯 Testa uma licitação específica
- 📄 Processa documentos se necessário
- 📊 Relatório detalhado do resultado

### 4. **Forçar Reprocessamento**
```bash
python test_unified_processor.py licitacao "SEU_ID_AQUI" --forcar
```
**O que faz:**
- 🗑️ Remove documentos existentes
- 🔄 Reprocessa todos os documentos
- 📄 Substitui dados anteriores

## 🔧 Funcionalidades de Validação

### ✅ **Validação de Configuração**
O sistema verifica automaticamente:

1. **🗄️ Conexão com Banco de Dados**
   - Testa conectividade PostgreSQL
   - Verifica permissões de leitura/escrita

2. **☁️ Conexão Supabase**
   - Valida API keys
   - Testa acesso ao storage

3. **📦 Bucket de Armazenamento**
   - Verifica existência do bucket
   - Testa permissões de upload

4. **📁 Diretórios Temporários**
   - Verifica criação de arquivos
   - Testa permissões de escrita

### 📊 **Monitoramento em Tempo Real**

Durante o processamento, você verá:

```
🧪 TESTE DE PROCESSAMENTO
Licitação ID: abc-123-def
Forçar reprocessamento: False
--------------------------------------------------
1️⃣ Validando configuração...
✅ Configuração OK
2️⃣ Verificando licitação...
✅ Licitação encontrada: Aquisição de equipamentos de informática...
3️⃣ Verificando documentos existentes...
⚠️ 5 documentos já processados
💡 Use forcar_reprocessamento=True para reprocessar
```

### 📋 **Lista Interativa de Licitações**

O sistema mostra licitações formatadas:

```
================================================================================
📋 LICITAÇÕES DISPONÍVEIS PARA TESTE
================================================================================

 1. ID: 550e8400-e29b-41d4-a716-446655440000
    PNCP ID: 123456789
    Objeto: Aquisição de equipamentos de informática para modernização...
    Modalidade: Pregão Eletrônico | UF: SP
    Valor: R$ 150,000.00
    Data: 2024-01-15
    Documentos: ✅ JÁ PROCESSADO (12 docs)

 2. ID: 550e8400-e29b-41d4-a716-446655440001
    PNCP ID: 987654321
    Objeto: Contratação de serviços de limpeza e conservação...
    Modalidade: Concorrência | UF: RJ
    Valor: R$ 85,500.00
    Data: 2024-01-14
    Documentos: ⏳ NÃO PROCESSADO (0 docs)
```

## 🐛 Troubleshooting

### ❌ **Erro de Conexão com Banco**
```bash
❌ Erro conexão banco: connection failed
```
**Solução:** Verifique suas configurações de banco no `DatabaseManager`

### ❌ **Erro Supabase**
```bash
❌ Erro Supabase: Invalid API key
```
**Solução:** 
1. Verifique as credenciais Supabase no código
2. Confirme que o projeto Supabase está ativo

### ❌ **Erro de Bucket**
```bash
❌ Erro bucket: Bucket not found
```
**Solução:** O sistema criará automaticamente, mas verifique permissões

### ⚠️ **Nenhuma Licitação Encontrada**
```bash
❌ Nenhuma licitação encontrada no banco
```
**Solução:** 
1. Verifique se há dados na tabela `licitacoes`
2. Execute scripts de população do banco se necessário

## 📁 Estrutura de Logs

Os logs são salvos em:
- **Console**: Output colorido em tempo real
- **Arquivo**: `test_processor.log` com detalhes completos

### 📊 **Exemplo de Log Completo**
```
2024-01-15 14:30:01 - Validando configuração do processador...
2024-01-15 14:30:01 - ✅ Conexão com banco validada
2024-01-15 14:30:02 - ✅ Conexão Supabase validada
2024-01-15 14:30:02 - ✅ Bucket 'licitacao-documents' acessível
2024-01-15 14:30:02 - ✅ Diretório temporário funcional
2024-01-15 14:30:02 - 🎉 Todas as validações passaram!
```

## 🚀 Próximos Passos

Após validar que tudo está funcionando:

1. **🔗 Integrar com RAG Service**: Use dados processados no sistema RAG
2. **📊 Monitorar Performance**: Acompanhe tempos de processamento
3. **🔄 Automatizar**: Configure processamento em lote
4. **📈 Escalar**: Otimize para grandes volumes de documentos

## 💡 Dicas de Uso

- **🧪 Sempre comece** com `python test_unified_processor.py rapido`
- **🎯 Use demo interativo** para entender o fluxo completo
- **🔄 Teste reprocessamento** quando houver mudanças no código
- **📊 Monitore logs** para identificar gargalos
- **🚀 Valide configuração** após mudanças de ambiente 