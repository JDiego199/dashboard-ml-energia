import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">Cargando Dashboard</h2>
        <p className="mt-2 text-gray-600">Procesando datos del modelo...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
