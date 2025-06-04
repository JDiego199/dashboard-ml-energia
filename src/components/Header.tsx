import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-xl border-b border-blue-700 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
                          <img src="/data/logo3.png" alt="Logo" className="w-12 h-12 rounded-full left-0 " />

            <div>
              <h1 className="text-2xl font-bold text-white">
                Análisis predictivo del consumo energético en Ecuador
              </h1>
              <p className="text-blue-200 text-sm">
                Análisis Avanzado de Consumo por Empresa
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-blue-200 text-sm">
                Sistema de Predicción
              </p>
              <p className="text-white font-semibold">
                Machine Learning
              </p>
            </div>
            

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
