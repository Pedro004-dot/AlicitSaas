import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ProcessProgressProps {
  isRunning: boolean;
  processType: 'daily' | 'reevaluate';
  message?: string;
  startTime?: Date;
}

const ProcessProgress: React.FC<ProcessProgressProps> = ({
  isRunning,
  processType,
  message,
  startTime
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProcessSteps = (type: 'daily' | 'reevaluate') => {
    if (type === 'daily') {
      return [
        { id: 'api', label: 'Conectando com PNCP', icon: '🔗' },
        { id: 'fetch', label: 'Baixando licitações', icon: '📥' },
        { id: 'process', label: 'Processando dados', icon: '⚙️' },
        { id: 'vectorize', label: 'Criando embeddings', icon: '🧮' },
        { id: 'match', label: 'Fazendo matching', icon: '🎯' },
        { id: 'save', label: 'Salvando resultados', icon: '💾' }
      ];
    } else {
      return [
        { id: 'load', label: 'Carregando licitações', icon: '📋' },
        { id: 'companies', label: 'Carregando empresas', icon: '🏢' },
        { id: 'clean', label: 'Limpando matches antigos', icon: '🧹' },
        { id: 'vectorize', label: 'Recalculando embeddings', icon: '🧮' },
        { id: 'match', label: 'Reavaliando matches', icon: '🔄' },
        { id: 'save', label: 'Atualizando banco', icon: '💾' }
      ];
    }
  };

  const getEstimatedStepTime = (stepId: string, type: 'daily' | 'reevaluate') => {
    const timeEstimates = {
      daily: {
        api: 10, fetch: 120, process: 60, vectorize: 180, match: 240, save: 30
      },
      reevaluate: {
        load: 30, companies: 10, clean: 20, vectorize: 300, match: 600, save: 60
      }
    };
    
    return timeEstimates[type][stepId as keyof typeof timeEstimates[typeof type]] || 60;
  };

  const getCurrentStep = (): { id: string; label: string; icon: string; progress?: number } => {
    const steps = getProcessSteps(processType);
    
    let cumulativeTime = 0;
    for (const step of steps) {
      const stepTime = getEstimatedStepTime(step.id, processType);
      if (elapsedTime <= cumulativeTime + stepTime) {
        return {
          ...step,
          progress: Math.min(100, ((elapsedTime - cumulativeTime) / stepTime) * 100)
        };
      }
      cumulativeTime += stepTime;
    }
    
    return steps[steps.length - 1];
  };

  const getOverallProgress = () => {
    const steps = getProcessSteps(processType);
    const totalEstimatedTime = steps.reduce((acc, step) => 
      acc + getEstimatedStepTime(step.id, processType), 0
    );
    
    return Math.min(100, (elapsedTime / totalEstimatedTime) * 100);
  };

  if (!isRunning) return null;

  const currentStep = getCurrentStep();
  const overallProgress = getOverallProgress();
  const steps = getProcessSteps(processType);

  return (
    <Card className="border-2 border-blue-200 bg-blue-50 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-xl">
            {processType === 'daily' ? '🔍 Buscando Novas Licitações' : '🔄 Reavaliando Licitações'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progresso Geral */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Etapa Atual */}
        <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{currentStep.icon}</span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800">{currentStep.label}</h3>
              <p className="text-sm text-gray-600">Etapa em execução...</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">
                {formatElapsedTime(elapsedTime)}
              </div>
            </div>
          </div>
          
          {currentStep.progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentStep.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Lista de Etapas */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Etapas do Processo:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {steps.map((step, index) => {
              const isCompleted = steps.findIndex(s => s.id === currentStep.id) > index;
              const isCurrent = step.id === currentStep.id;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    isCompleted 
                      ? 'bg-green-100 text-green-700' 
                      : isCurrent 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  <span className="text-base">{step.icon}</span>
                  <span className="flex-1">{step.label}</span>
                  {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isCurrent && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mensagem Atual */}
        {message && (
          <div className="bg-white/80 rounded-lg p-3 border border-gray-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-700">{message}</p>
            </div>
          </div>
        )}

        {/* Dicas */}
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-700">
              <p className="font-medium mb-1">Dica:</p>
              <p>
                {processType === 'daily' 
                  ? 'Este processo busca licitações em todos os 26 estados brasileiros. Pode demorar entre 5-15 minutos.'
                  : 'A reavaliação analisa todas as licitações existentes com algoritmos atualizados. Tempo estimado: 10-30 minutos.'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessProgress; 