FROM python:3.11-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    libpq-dev \
    libmagic1 \
    libmagic-dev \
    file \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Configurar variáveis de ambiente para libmagic
ENV MAGIC_MIME="/usr/share/misc/magic"
ENV LD_LIBRARY_PATH="/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# Definir diretório de trabalho
WORKDIR /app

# Configurar PYTHONPATH para incluir src
ENV PYTHONPATH="${PYTHONPATH}:/app/src"

# Copiar requirements primeiro (para cache de layers)
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretórios necessários
RUN mkdir -p logs storage temp uploads

# Expor porta
EXPOSE $PORT

# Comando para iniciar a aplicação
CMD gunicorn --bind 0.0.0.0:$PORT "src.app:create_app()" 