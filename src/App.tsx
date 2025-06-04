import { useState } from 'react';
import { useData } from './hooks/useData';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

function App() {
  const { data, loading, error } = useData();
  const [activeSection, setActiveSection] = useState('dataset');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return <ErrorMessage message={error || 'Error al cargar datos'} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <div className="flex">
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        <main className="flex-1 ml-80 mr-6">
          <Dashboard
            data={data}
            activeSection={activeSection}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
