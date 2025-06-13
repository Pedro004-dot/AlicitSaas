import React from 'react';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 Análises</h1>
        <p className="text-gray-600">
          Métricas e insights sobre o desempenho do sistema de matching
        </p>
      </div>

      {/* Em Desenvolvimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Dashboard de Análises</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Em Desenvolvimento
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Esta seção conterá métricas avançadas, gráficos de performance, 
              e análises detalhadas sobre o sistema de matching.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                <h4 className="font-medium text-blue-900 mb-1">Taxa de Conversão</h4>
                <p className="text-sm text-blue-700">
                  Análise da eficácia dos matches gerados
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                <h4 className="font-medium text-green-900 mb-1">Performance por Setor</h4>
                <p className="text-sm text-green-700">
                  Comparação de matches entre diferentes setores
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <AlertCircle className="w-8 h-8 text-purple-600 mb-2" />
                <h4 className="font-medium text-purple-900 mb-1">Qualidade dos Matches</h4>
                <p className="text-sm text-purple-700">
                  Distribuição de scores e métricas de qualidade
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage; 