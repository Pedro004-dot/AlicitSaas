import React, { useState, useEffect } from 'react';
import { 
  Home, 
  FileText, 
  Link, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import logoAlicit from '../../assets/logoAlicitDegrade.png';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    description: 'Visão geral e dashboard'
  },
  {
    id: 'licitacoes',
    label: 'Licitações',
    icon: FileText,
    description: 'Gerenciar licitações'
  },
  {
    id: 'matches',
    label: 'Matches',
    icon: Link,
    description: 'Correspondências encontradas'
  },
  {
    id: 'empresas',
    label: 'Empresas',
    icon: Building2,
    description: 'Gerenciar empresas'
  }
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  // Estado para controlar se está expandida ou minimizada
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Estado para controlar se está aberta no mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Detectar tamanho da tela para responsividade
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Executar na montagem

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleItemClick = (pageId: string) => {
    onPageChange(pageId);
    // Fechar menu mobile após seleção
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Botão hamburger para mobile */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobile}
          className="p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Menu className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Overlay para mobile */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-16'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Header da sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {/* Logo/Título */}
            <div className={`flex items-center space-x-3 ${!isExpanded && 'justify-center'}`}>
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                <img 
                  src={logoAlicit} 
                  alt="Alicit Logo" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              {isExpanded && (
                <div className="flex flex-col">
                  <h1 className="text-lg font-bold text-gray-900">Alicit</h1>
                  <p className="text-xs text-gray-500">Gestão Inteligente</p>
                </div>
              )}
            </div>

            {/* Botão de minimizar (apenas desktop) */}
            <button
              onClick={toggleExpanded}
              className={`
                hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 transition-colors
                ${!isExpanded && 'mx-auto'}
              `}
            >
              {isExpanded ? (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Menu de navegação */}
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg
                  transition-all duration-200 text-left
                  ${isActive 
                    ? 'bg-orange-50 text-orange-700 border-l-4 border-[#FF7610]' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${!isExpanded && 'justify-center px-2'}
                `}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon 
                  className={`
                    w-5 h-5 flex-shrink-0
                    ${isActive ? 'text-[#FF7610]' : 'text-gray-500'}
                  `} 
                />
                {isExpanded && (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer da sidebar (quando expandida) */}
        {isExpanded && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#FF7610] rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Sistema Online</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spacer para o conteúdo principal (apenas desktop) */}
      <div className={`hidden md:block transition-all duration-300 ${isExpanded ? 'w-64' : 'w-16'}`} />
    </>
  );
};

export default Sidebar; 