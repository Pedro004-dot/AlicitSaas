import React, { useState } from 'react';
import { Settings, Brain, Sliders, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import VectorizerSelection from '../components/config/VectorizerSelection';
import { MatchingConfig } from '../types';

const ConfigPage: React.FC = () => {
  // Dummy config para evitar erro de tipo
  const [config, setConfig] = useState<MatchingConfig>({
    similarity_threshold_phase1: 0.65,
    similarity_threshold_phase2: 0.7,
    vectorizer_type: 'sentence_transformers',
    max_pages: 5,
    clear_matches: true
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ Configurações</h1>
        <p className="text-gray-600">
          Configure parâmetros do sistema de matching e modelos de IA
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configurações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Configuração do Vetorizador */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span>Modelo de Vetorização</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VectorizerSelection config={config} setConfig={setConfig} />
            </CardContent>
          </Card>

          {/* Configurações de Threshold */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span>Thresholds de Similaridade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threshold Fase 1 (Pré-filtro)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      defaultValue="0.65"
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">65%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score mínimo para que um match seja considerado relevante
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threshold Fase 2 (Ranking)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      defaultValue="0.70"
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">70%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score mínimo para que um match apareça no ranking final
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar de Informações */}
        <div className="space-y-6">
          {/* Status Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="w-5 h-5 text-green-600" />
                <span>Status Atual</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vetorizador:</span>
                  <span className="font-medium text-green-700">SentenceTransformers</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modo:</span>
                  <span className="font-medium">Local/Offline</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threshold 1:</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Threshold 2:</span>
                  <span className="font-medium">70%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <span>Informações</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-1">💡 Dica</p>
                  <p>Thresholds mais baixos resultam em mais matches, mas com menor precisão.</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-medium text-green-800 mb-1">✅ Recomendação</p>
                  <p>Use 65-70% para balance entre precisão e recall.</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="font-medium text-amber-800 mb-1">⚠️ Atenção</p>
                  <p>Mudanças nos thresholds requerem reavaliação dos matches.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Velocidade</span>
                    <span className="font-medium">Média</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Precisão</span>
                    <span className="font-medium">Alta</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-5/6"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Custo</span>
                    <span className="font-medium text-green-600">Gratuito</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage; 