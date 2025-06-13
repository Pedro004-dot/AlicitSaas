import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MatchesPage from './pages/MatchesPage';
import CompaniesPage from './pages/CompaniesPage';
import ConfigPage from './pages/ConfigPage';
import BidAnalysisPage from './pages/BidAnalysisPage';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onPageChange={setCurrentPage} />;
      case 'licitacoes':
        return <SearchPage />;
      case 'matches':
        return <MatchesPage />;
      case 'empresas':
        return <CompaniesPage />;
      case 'config':
        return <ConfigPage />;
      default:
        return <HomePage onPageChange={setCurrentPage} />;
    }
  };

  return (
    <Router>
      <Routes>
        {/* Rota específica para análise de licitação */}
        <Route path="/analise-licitacao" element={<BidAnalysisPage />} />
        
        {/* Rota principal com sidebar */}
        <Route path="/*" element={
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 min-h-screen">
        {renderCurrentPage()}
      </main>
    </div>
        } />
      </Routes>
    </Router>
  );
};

export default App;
