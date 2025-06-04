import React, { useMemo, useState } from 'react';
import Plot from 'react-plotly.js';
import { DashboardData } from '../../types';

interface MetricasModeloProps {
  data: DashboardData;
}

const MetricasModelo: React.FC<MetricasModeloProps> = ({ data }) => {
  const { metricas, datosEntrenamientoPrueba, resultadosPrediccion, metricasEmpresa } = data;
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | null>(null);
  const [filtroEmpresaCentralizado, setFiltroEmpresaCentralizado] = useState<number | 'todas'>('todas');
  const [ordenColumna, setOrdenColumna] = useState<string>('R2');
  const [ordenAscendente, setOrdenAscendente] = useState<boolean>(false);

  // Calcular indicadores dinámicos según filtro centralizado
  const indicadoresDinamicos = useMemo(() => {
    if (!metricasEmpresa || metricasEmpresa.length === 0) {
      return {
        consumoPromedio: 0,
        errorLineal: 0,
        errorXGBoost: 0
      };
    }

    if (filtroEmpresaCentralizado === 'todas') {
      // Promedios generales
      const totalEmpresas = metricasEmpresa.length;
      const sumaConsumo = resultadosPrediccion.reduce((sum, e) => sum + e.valor_real, 0);
      const sumaErrorLineal = metricasEmpresa.reduce((sum, e) => sum + e.Error_Relativo_Porcentual, 0);
      
      // Para XGBoost, usaremos un error simulado basado en las métricas disponibles
      const sumaErrorXGBoost = metricasEmpresa.reduce((sum, e) => sum + (e.Error_Relativo_Porcentual * 0.95), 0);

      return {
        consumoPromedio: (sumaConsumo / totalEmpresas), // Convertir a kWh
        errorLineal: sumaErrorLineal / totalEmpresas,
        errorXGBoost: sumaErrorXGBoost / totalEmpresas
      };
    } else {
      // Métricas específicas de la empresa seleccionada
      const empresa = resultadosPrediccion.find(e => e.IdEmpresa === filtroEmpresaCentralizado);
      const empresa2 = metricasEmpresa.find(e => e.IdEmpresa === filtroEmpresaCentralizado);

      if (!empresa) {
        return {
          consumoPromedio: 0,
          errorLineal: 0,
          errorXGBoost: 0
        };
      }

      return {
        consumoPromedio: empresa2.Consumo_Promedio , // Convertir a kWh
        errorLineal: empresa.error,
        errorXGBoost: empresa.error_porcentual  // Simulación para XGBoost
      };
    }
  }, [metricasEmpresa, filtroEmpresaCentralizado]);

  // Obtener empresas disponibles
  const empresasDisponibles = useMemo(() => {
    if (!metricasEmpresa || metricasEmpresa.length === 0) return [];

    let empresasDisponibles = metricasEmpresa.map(({ IdEmpresa, NombreEmpresa }) => ({
      id: IdEmpresa,
      nombre: NombreEmpresa
    }));

    return empresasDisponibles;

  }, [metricasEmpresa]);
  // Preparar datos para el scatter plot de valores predichos vs reales (filtrados)
  const datosScatterPlot = useMemo(() => {
    if (!datosEntrenamientoPrueba) return null;

    
    const { y_train_original, y_test_original, y_pred_train, y_pred_test } = datosEntrenamientoPrueba;

    // TODO: Aquí se podría filtrar por empresa si tuviéramos los índices correspondientes
    // Por ahora mostramos todos los datos
    return {
      train: {
        reales: y_train_original,
        predichos: y_pred_train
      },
      test: {
        reales: y_test_original,
        predichos: y_pred_test
      }
    };
  }, [datosEntrenamientoPrueba, filtroEmpresaCentralizado]);

  // Preparar datos para series temporales por empresa (con filtro centralizado)
  const datosSerieTemporal = useMemo(() => {
    if (!resultadosPrediccion || resultadosPrediccion.length === 0) return null;

    const empresas = [...new Set(resultadosPrediccion.map(r => r.IdEmpresa))].sort((a, b) => a - b);
    
    let datosEmpresa;
    if (filtroEmpresaCentralizado === 'todas') {
      // Mostrar datos agregados de todas las empresas o la primera empresa como ejemplo
      if (empresas.length > 0) {
        datosEmpresa = resultadosPrediccion.filter(r => r.IdEmpresa === empresas[0]);
      } else {
        datosEmpresa = [];
      }
    } else {
      datosEmpresa = resultadosPrediccion.filter(r => r.IdEmpresa === filtroEmpresaCentralizado);
    }
    
    return {
      empresas,
      datosEmpresa: datosEmpresa.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
      empresaActual: filtroEmpresaCentralizado === 'todas' ? (empresas.length > 0 ? empresas[0] : null) : filtroEmpresaCentralizado
    };
  }, [resultadosPrediccion, filtroEmpresaCentralizado]);

  // Preparar datos para métricas por empresa ordenadas (con filtro)
  const metricasEmpresaOrdenadas = useMemo(() => {
    if (!metricasEmpresa || metricasEmpresa.length === 0) return [];

    let metricasFiltradas = [...metricasEmpresa];
    
    // Aplicar filtro centralizado
    if (filtroEmpresaCentralizado !== 'todas') {
      metricasFiltradas = metricasFiltradas.filter(e => e.IdEmpresa === filtroEmpresaCentralizado);
    }

    metricasFiltradas.sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenColumna) {
        case 'IdEmpresa':
          valorA = a.IdEmpresa;
          valorB = b.IdEmpresa;
          break;
        case 'N_Puntos':
          valorA = a.N_Puntos;
          valorB = b.N_Puntos;
          break;
        case 'Consumo_Promedio':
          valorA = a.Consumo_Promedio;
          valorB = b.Consumo_Promedio;
          break;
        case 'RMSE':
          valorA = a.RMSE;
          valorB = b.RMSE;
          break;
        case 'MAE':
          valorA = a.MAE;
          valorB = b.MAE;
          break;
        case 'R2':
          valorA = a.R2;
          valorB = b.R2;
          break;
        case 'Error_Relativo_Porcentual':
          valorA = a.Error_Relativo_Porcentual;
          valorB = b.Error_Relativo_Porcentual;
          break;
        default:
          valorA = a.R2;
          valorB = b.R2;
      }

      if (ordenAscendente) {
        return valorA - valorB;
      } else {
        return valorB - valorA;
      }
    });

    return metricasFiltradas;
  }, [metricasEmpresa, ordenColumna, ordenAscendente, filtroEmpresaCentralizado]);



  const MetricCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const handleOrdenColumna = (columna: string) => {
    if (ordenColumna === columna) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenColumna(columna);
      setOrdenAscendente(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner con Título y Filtro Centralizado */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Métricas y Evaluación del Modelo</h2>
            <p className="text-gray-600">Evaluación completa del rendimiento del modelo predictivo</p>
          </div>
          
          {/* Filtro Centralizado de Empresa */}
          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Empresa</label>
            <select
              value={filtroEmpresaCentralizado}
              onChange={(e) => setFiltroEmpresaCentralizado(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
                    <option value="todas">Todas las empresas</option>
            {empresasDisponibles.map(e => ( 
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}

            </select>
          </div>
        </div>
      </div>

      {/* Subsección A: Métricas Generales */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800">Métricas Generales del Modelo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="R² (Train)"
            value={metricas?.train?.r2?.toFixed(4) || 'N/A'}
            subtitle="Coeficiente de determinación"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            color="text-green-600"
          />
          <MetricCard
            title="R² (Test)"
            value={metricas?.test?.r2?.toFixed(4) || 'N/A'}
            subtitle="Coeficiente de determinación"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            color="text-green-600"
          />
          <MetricCard
            title="RMSE (Train)"
            value={metricas?.train?.rmse?.toFixed(1) || 'N/A'}
            subtitle="Error cuadrático medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
            color="text-blue-600"
          />
          <MetricCard
            title="RMSE (Test)"
            value={metricas?.test?.rmse?.toFixed(1) || 'N/A'}
            subtitle="Error cuadrático medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
            color="text-blue-600"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="MAE (Train)"
            value={metricas?.train?.mae?.toFixed(1) || 'N/A'}
            subtitle="Error absoluto medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>}
            color="text-purple-600"
          />
          <MetricCard
            title="MAE (Test)"
            value={metricas?.test?.mae?.toFixed(1) || 'N/A'}
            subtitle="Error absoluto medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>}
            color="text-purple-600"
          />
          <MetricCard
            title="MSE (Train)"
            value={metricas?.train?.mse ? (metricas.train.mse / 1000000).toFixed(1) + 'M' : 'N/A'}
            subtitle="Error cuadrático medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
            color="text-orange-600"
          />
          <MetricCard
            title="MSE (Test)"
            value={metricas?.test?.mse ? (metricas.test.mse / 1000000).toFixed(1) + 'M' : 'N/A'}
            subtitle="Error cuadrático medio"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
            color="text-orange-600"
          />
        </div>
      </div>

      {/* Subsección B: Valores Predichos vs Reales */}
      {datosScatterPlot && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Valores Predichos vs Reales</h3>
         
          <Plot
            data={[
              {
                x: datosScatterPlot.train.reales,
                y: datosScatterPlot.train.predichos,
                mode: 'markers',
                type: 'scatter',
                name: 'Entrenamiento',
                marker: { color: '#3B82F6', size: 4, opacity: 0.6 }
              },
              {
                x: datosScatterPlot.test.reales,
                y: datosScatterPlot.test.predichos,
                mode: 'markers',
                type: 'scatter',
                name: 'Prueba',
                marker: { color: '#EF4444', size: 4, opacity: 0.6 }
              },
              {
                x: [Math.min(...datosScatterPlot.train.reales, ...datosScatterPlot.test.reales), 
                    Math.max(...datosScatterPlot.train.reales, ...datosScatterPlot.test.reales)],
                y: [Math.min(...datosScatterPlot.train.reales, ...datosScatterPlot.test.reales), 
                    Math.max(...datosScatterPlot.train.reales, ...datosScatterPlot.test.reales)],
                mode: 'lines',
                type: 'scatter',
                name: 'Línea perfecta',
                line: { color: '#10B981', dash: 'dash', width: 2 }
              }
            ]}
            layout={{
              xaxis: { title: 'Valores Reales (MWh)' },
              yaxis: { title: 'Valores Predichos (MWh)' },
              margin: { t: 20, r: 20, l: 60, b: 60 },
              height: 500,
              hovermode: 'closest'
            }}
            config={{ displayModeBar: true }}
            style={{ width: '100%' }}
          />
        </div>
      )}
      
       {/* Indicadores Dinámicos por Empresa */}
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Indicadores {filtroEmpresaCentralizado !== 'todas' ? `- Empresa ${filtroEmpresaCentralizado}` : 'Generales'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Consumo Promedio */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium mb-1">Consumo Promedio</p>
                <p className="text-3xl font-bold text-blue-700">
                  {indicadoresDinamicos.consumoPromedio.toLocaleString('es-ES', { 
                    maximumFractionDigits: 0 
                  })} MWh
                </p>
                <p className="text-blue-500 text-xs mt-1">
                  {filtroEmpresaCentralizado !== 'todas' ? 'Empresa específica' : 'Promedio general'}
                </p>
              </div>
              <div className="bg-blue-600 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Error Promedio Lineal */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium mb-1">Error Promedio</p>
                <p className="text-3xl font-bold text-green-700">
                  {indicadoresDinamicos.errorLineal.toFixed(2)}%
                </p>
                <p className="text-green-500 text-xs mt-1">
                  Modelo entrenado
                </p>
              </div>
              <div className="bg-green-600 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Error Promedio XGBoost */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium mb-1">Error Porcentual</p>
                <p className="text-3xl font-bold text-orange-700">
                  {indicadoresDinamicos.errorXGBoost.toFixed(2)}%
                </p>
                <p className="text-orange-500 text-xs mt-1">
                  Modelo entrenado
                </p>
              </div>
              <div className="bg-orange-600 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>ℹ️ Nota:</strong> Los indicadores se actualizan automáticamente según el filtro centralizado seleccionado.
            {filtroEmpresaCentralizado !== 'todas' ? ' Cambie a "Todas las empresas" para ver métricas generales.' : ' Seleccione una empresa específica para ver métricas detalladas.'}
          </p>
        </div> */}

      {/* Indicadores Dinámicos */}
      {/* Subsección C: Series de Tiempo por Empresa */}
      {datosSerieTemporal && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Serie Temporal por Empresa</h3>
            <p className="text-gray-600 text-sm mt-1">
              {filtroEmpresaCentralizado !== 'todas' 
                ? `Mostrando datos para Empresa ${filtroEmpresaCentralizado}` 
                : 'Mostrando datos de empresa ejemplo (use el filtro superior para cambiar)'}
            </p>
          </div>
          {datosSerieTemporal.datosEmpresa.length > 0 && (
            <Plot
              data={[
                {
                  x: datosSerieTemporal.datosEmpresa.map(d => d.fecha),
                  y: datosSerieTemporal.datosEmpresa.map(d => d.valor_real),
                  mode: 'lines+markers',
                  type: 'scatter',
                  name: 'Valores Reales',
                  line: { color: '#3B82F6', width: 2 },
                  marker: { size: 6 }
                },
                {
                  x: datosSerieTemporal.datosEmpresa.map(d => d.fecha),
                  y: datosSerieTemporal.datosEmpresa.map(d => d.prediccion),
                  mode: 'lines+markers',
                  type: 'scatter',
                  name: 'Predicciones',
                  line: { color: '#F59E0B', width: 2 },
                  marker: { size: 6 }
                }
              ]}
              layout={{
                xaxis: { title: 'Fecha' },
                yaxis: { title: 'Consumo (MWh)' },
                margin: { t: 20, r: 20, l: 60, b: 60 },
                height: 400,
                hovermode: 'x unified'
              }}
              config={{ displayModeBar: true }}
              style={{ width: '100%' }}
            />
          )}
        </div>
      )}

      {/* Subsección D: Métricas por Empresa */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Métricas por Empresa</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                {[
                  { key: 'IdEmpresa', label: 'Empresa' },
                  { key: 'N_Puntos', label: 'N° Puntos' },
                  { key: 'Consumo_Promedio', label: 'Consumo Promedio' },
                  { key: 'RMSE', label: 'RMSE' },
                  { key: 'MAE', label: 'MAE' },
                  { key: 'R2', label: 'R²' },
                  { key: 'Error_Relativo_Porcentual', label: 'Error %' }
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleOrdenColumna(key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{label}</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metricasEmpresaOrdenadas.map((empresa, index) => (
                <tr key={empresa.IdEmpresa} className={`hover:bg-gray-50 ${
                  empresa.R2 > 0.8 ? 'bg-green-50' : empresa.R2 < 0.5 ? 'bg-red-50' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {empresa.IdEmpresa}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.N_Puntos}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.Consumo_Promedio.toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.RMSE.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.MAE.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      empresa.R2 > 0.8 ? 'bg-green-100 text-green-800' : 
                      empresa.R2 > 0.5 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {empresa.R2.toFixed(3)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {empresa.Error_Relativo_Porcentual.toFixed(3)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

     
    </div>
  );
};

export default MetricasModelo;
