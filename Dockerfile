# ===============================================
# DOCKERFILE OTIMIZADO PARA RAILWAY DEPLOYMENT
# Multi-stage build, health checks, security
# ===============================================

# Stage 1: Build dependencies
FROM python:3.11-slim as builder

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    pkg-config \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install Python dependencies
COPY requirements-railway.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements-railway.txt

# ===============================================
# Stage 2: Production runtime
FROM python:3.11-slim as production

# Prevent Python from writing pyc files and buffering stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/opt/venv/bin:$PATH"

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Create app user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set work directory
WORKDIR /app

# Copy application code (agora da raiz)
COPY src/ ./src/
COPY requirements-railway.txt .

# Create necessary directories
RUN mkdir -p logs uploads temp storage && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Railway expects the app to run on PORT from environment
ENV PORT=8080
ENV FLASK_ENV=production
ENV FLASK_DEBUG=False

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:$PORT/health || exit 1

# Expose port
EXPOSE $PORT

# Use gunicorn for production with optimized settings for Railway
CMD ["sh", "-c", "cd src && gunicorn -w 2 -b 0.0.0.0:$PORT --timeout 120 --keep-alive 60 --max-requests 1000 --max-requests-jitter 100 --preload app:app"]

# ===============================================
# RAILWAY OPTIMIZATION NOTES:
# ===============================================
# 1. Multi-stage build reduces final image size
# 2. No ML dependencies = faster builds
# 3. Health checks for Railway monitoring  
# 4. Port from env variable (Railway standard)
# 5. Non-root user for security
# 6. Gunicorn optimized for Railway limits
# 7. Preload app for faster response times
# =============================================== 