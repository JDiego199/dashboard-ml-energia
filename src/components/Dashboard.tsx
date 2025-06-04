import React from 'react';
import { DashboardData } from '../types';
import AnalisisDataset from './sections/AnalisisDataset';
import MetricasModelo from './sections/MetricasModelo';
import Predicciones from './sections/Predicciones';

interface DashboardProps {
  data: DashboardData;
  activeSection: string;
}

const Dashboard: React.FC<DashboardProps> = ({ data, activeSection }) => {
  const renderSection = () => {
    switch (activeSection) {
      case 'dataset':
        return <AnalisisDataset data={data} />;
      case 'metricas':
        return <MetricasModelo data={data} />;
      case 'prediccion':
        return <Predicciones data={data} />;
      default:
        return <AnalisisDataset data={data} />;
    }
  };

  return (
    <div className="p-6 min-h-screen mt-20">
      {renderSection()}
    </div>
  );
};

export default Dashboard;
