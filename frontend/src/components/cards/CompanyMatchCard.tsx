import React from 'react';
import { TrendingUp, Award, Target, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CompanyMatch } from '../../types';
import { getScoreColor, getScorePercentage } from '../../utils';

interface CompanyMatchCardProps {
  companyMatch: CompanyMatch;
}

const CompanyMatchCard: React.FC<CompanyMatchCardProps> = ({ companyMatch }) => {
  const getScoreIcon = (score: number) => {
    const percentage = getScorePercentage(score);
    if (percentage >= 80) return <Award className="h-4 w-4" />;
    if (percentage >= 60) return <TrendingUp className="h-4 w-4" />;
    return <Target className="h-4 w-4" />;
  };

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{companyMatch.empresa_nome}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {companyMatch.total_matches} matches
            </div>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(companyMatch.melhor_score)}`}>
              {getScoreIcon(companyMatch.melhor_score)}
              {Math.round(companyMatch.melhor_score * 100)}% melhor
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações da Empresa */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Empresa ID:</span> {companyMatch.empresa_id}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estatísticas de Compatibilidade
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(companyMatch.melhor_score * 100)}%
                </div>
                <div className="text-sm text-gray-600">Melhor Match</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
                  <DollarSign className="h-5 w-5" />
                  {formatCurrency(companyMatch.valor_total_oportunidades)}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyMatchCard; 