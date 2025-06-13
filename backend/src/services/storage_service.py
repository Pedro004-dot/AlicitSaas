import os
import logging
from typing import Optional, Dict, Any, List
import httpx
from pathlib import Path

logger = logging.getLogger(__name__)

class StorageService:
    """Serviço para gerenciar uploads no Supabase Storage"""
    
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url.rstrip('/')
        self.supabase_key = supabase_key
        self.bucket_name = 'licitacao-documents'
        
    async def upload_file(self, 
                         file_path: str, 
                         destination_path: str,
                         content_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Upload de arquivo para o Supabase Storage
        
        Args:
            file_path: Caminho local do arquivo
            destination_path: Caminho de destino no bucket
            content_type: Content-type do arquivo (opcional)
            
        Returns:
            Dict com resultado do upload
        """
        try:
            # Verificar se arquivo existe
            if not os.path.exists(file_path):
                return {
                    'success': False,
                    'error': f'Arquivo não encontrado: {file_path}'
                }
            
            # Determinar content-type se não fornecido
            if not content_type:
                if file_path.lower().endswith('.pdf'):
                    content_type = 'application/pdf'
                elif file_path.lower().endswith('.doc'):
                    content_type = 'application/msword'
                elif file_path.lower().endswith('.docx'):
                    content_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                else:
                    content_type = 'application/octet-stream'
            
            # Preparar headers
            headers = {
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': content_type
            }
            
            # Ler arquivo
            with open(file_path, 'rb') as f:
                file_data = f.read()
            
            # Fazer upload
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{destination_path}"
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url,
                    headers=headers,
                    content=file_data,
                    timeout=30.0
                )
                
                if response.status_code in (200, 201):
                    return {
                        'success': True,
                        'path': destination_path,
                        'size': len(file_data),
                        'content_type': content_type
                    }
                else:
                    error_detail = response.text if response.text else f'Status code: {response.status_code}'
                    return {
                        'success': False,
                        'error': f'Erro no upload: {error_detail}',
                        'status_code': response.status_code
                    }
                    
        except Exception as e:
            logger.error(f"❌ Erro no upload para Storage: {e}")
            return {
                'success': False,
                'error': f'Erro interno: {str(e)}'
            }

    def upload(self, destination_path: str, file_content: bytes, content_type: str = 'application/octet-stream') -> bool:
        """
        Upload síncrono de conteúdo de arquivo para o Supabase Storage
        
        Args:
            destination_path: Caminho de destino no bucket
            file_content: Conteúdo do arquivo em bytes
            content_type: Content-type do arquivo
            
        Returns:
            True se sucesso, False se erro
        """
        try:
            # Preparar headers
            headers = {
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': content_type
            }
            
            # Fazer upload
            url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{destination_path}"
            
            import requests
            response = requests.post(
                url,
                headers=headers,
                data=file_content,
                timeout=30.0
            )
            
            if response.status_code in (200, 201):
                logger.info(f"✅ Upload realizado: {destination_path}")
                return True
            elif response.status_code == 409:
                # Arquivo já existe
                logger.info(f"📁 Arquivo já existe: {destination_path}")
                return True
            else:
                logger.error(f"❌ Erro no upload: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro no upload: {e}")
            return False

    def list(self, prefix: str = "") -> List[Dict[str, Any]]:
        """
        Lista arquivos no bucket
        
        Args:
            prefix: Prefixo para filtrar arquivos
            
        Returns:
            Lista de arquivos
        """
        try:
            headers = {
                'Authorization': f'Bearer {self.supabase_key}'
            }
            
            url = f"{self.supabase_url}/storage/v1/object/list/{self.bucket_name}"
            
            params = {}
            if prefix:
                params['prefix'] = prefix
            
            import requests
            response = requests.post(
                url,
                headers=headers,
                json=params,
                timeout=30.0
            )
            
            if response.status_code == 200:
                files = response.json()
                return files if isinstance(files, list) else []
            else:
                logger.warning(f"⚠️ Erro ao listar arquivos: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Erro ao listar arquivos: {e}")
            return []

    def list_buckets(self) -> List[Any]:
        """
        Lista buckets disponíveis
        
        Returns:
            Lista de buckets
        """
        try:
            headers = {
                'Authorization': f'Bearer {self.supabase_key}'
            }
            
            url = f"{self.supabase_url}/storage/v1/bucket"
            
            import requests
            response = requests.get(url, headers=headers, timeout=30.0)
            
            if response.status_code == 200:
                buckets = response.json()
                return buckets if isinstance(buckets, list) else []
            else:
                logger.warning(f"⚠️ Erro ao listar buckets: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"❌ Erro ao listar buckets: {e}")
            return []

    def get_public_url(self, file_path: str) -> str:
        """
        Gera URL pública para um arquivo
        
        Args:
            file_path: Caminho do arquivo no bucket
            
        Returns:
            URL pública do arquivo
        """
        return f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{file_path}"
            
    async def ensure_bucket_exists(self) -> bool:
        """Verifica se bucket existe e cria se necessário"""
        try:
            headers = {
                'Authorization': f'Bearer {self.supabase_key}'
            }
            
            # Verificar se bucket existe
            url = f"{self.supabase_url}/storage/v1/bucket/{self.bucket_name}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    logger.info(f"✅ Bucket '{self.bucket_name}' existe e está acessível")
                    return True
                    
                # Se erro 400/403, pode ser problema de permissão mas bucket pode existir
                if response.status_code in (400, 403):
                    logger.warning(f"⚠️ Erro de permissão ao verificar bucket (pode existir): {response.status_code}")
                    # Assumir que bucket existe (verificado via SQL)
                    return True
                    
                # Se não existe, tentar criar
                if response.status_code == 404:
                    logger.info(f"📦 Bucket não encontrado, tentando criar...")
                    create_url = f"{self.supabase_url}/storage/v1/bucket"
                    bucket_config = {
                        'id': self.bucket_name,
                        'name': self.bucket_name,
                        'public': True,
                        'file_size_limit': 52428800,  # 50MB
                        'allowed_mime_types': [
                            'application/pdf',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        ]
                    }
                    
                    create_response = await client.post(
                        create_url,
                        headers=headers,
                        json=bucket_config
                    )
                    
                    if create_response.status_code in (200, 201):
                        logger.info(f"✅ Bucket criado com sucesso")
                        return True
                    else:
                        logger.error(f"❌ Erro ao criar bucket: {create_response.status_code} - {create_response.text}")
                        return False
                    
                logger.error(f"❌ Erro inesperado ao verificar bucket: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao verificar/criar bucket: {e}")
            # Se bucket já existe (confirmado via SQL), assumir sucesso
            logger.warning(f"⚠️ Assumindo que bucket existe (confirmado via SQL)")
            return True 