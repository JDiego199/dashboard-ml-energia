import React, { useMemo, useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { DashboardData, DatasetRow } from '../../types';

interface AnalisisDatasetProps {
  data: DashboardData;
}

interface MapaData {
  type: string;
  name: string;
  features: Array<{
    type: string;
    properties: {
      IDSISDAT: number;
      Arco_Nombr: string;
      Empresa: string;
      Regional: string;
    };
    geometry: any;
  }>;
}

const AnalisisDataset: React.FC<AnalisisDatasetProps> = ({ data }) => {
  const { dataset } = data;
  
  // Estados para filtros
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<number | 'todas'>('todas');
  const [añoSeleccionado, setAñoSeleccionado] = useState<number | 'todos'>('todos');
  const [mapaData, setMapaData] = useState<MapaData | null>(null);

  // Cargar datos del mapa
  useEffect(() => {
    const cargarMapa = async () => {
      try {
        const response = await fetch('/data/mapa.json');
        const data = await response.json();
        setMapaData(data);
      } catch (error) {
        console.error('Error cargando mapa:', error);
      }
    };
    cargarMapa();
  }, []);

  // Obtener opciones para filtros
  const { empresasDisponibles, añosDisponibles } = useMemo(() => {
    if (!dataset || dataset.length === 0) return { empresasDisponibles: [], añosDisponibles: [] };

    const empresas = [...new Set(dataset.map(d => d.IdEmpresa))].sort((a, b) => a - b);
    const años = [...new Set(dataset.map(d => d.Año))].sort((a, b) => a - b);

    return {
      empresasDisponibles: empresas,
      añosDisponibles: años
    };
  }, [dataset]);

  // Filtrar datos según selecciones
  const datosFiltrados = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];

    let filtrados = [...dataset];

    if (empresaSeleccionada !== 'todas') {
      filtrados = filtrados.filter(d => d.IdEmpresa === empresaSeleccionada);
    }

    if (añoSeleccionado !== 'todos') {
      filtrados = filtrados.filter(d => d.Año === añoSeleccionado);
    }

    return filtrados;
  }, [dataset, empresaSeleccionada, añoSeleccionado]);

  // Obtener nombre de empresa por ID
  const obtenerNombreEmpresa = (idEmpresa: number): string => {
    if (!mapaData) return `Empresa ${idEmpresa}`;
    const feature = mapaData.features.find(f => f.properties.IDSISDAT === idEmpresa);
    return feature ? feature.properties.Arco_Nombr : `Empresa ${idEmpresa}`;
  };

  // 1. Consumo Promedio por Empresa
  const datosConsumoEmpresa = useMemo(() => {
    if (!datosFiltrados.length) return null;

    const consumoPorEmpresa = datosFiltrados.reduce((acc, row) => {
      if (!acc[row.IdEmpresa]) {
        acc[row.IdEmpresa] = [];
      }
      acc[row.IdEmpresa].push(row['Energía Facturada (MWh)']);
      return acc;
    }, {} as Record<number, number[]>);

    const promedios = Object.entries(consumoPorEmpresa).map(([empresa, consumos]) => ({
      empresa: parseInt(empresa),
      promedio: consumos.reduce((a, b) => a + b, 0) / consumos.length
    })).sort((a, b) => b.promedio - a.promedio);

    return promedios;
  }, [datosFiltrados]);

  // 2. Evolución Temporal del Consumo
  const datosEvolucionTemporal = useMemo(() => {
    if (!datosFiltrados.length) return null;

    // Crear columna fecha y agrupar por fecha para promedio mensual
    const consumoPorFecha: Record<string, number[]> = {};
    datosFiltrados.forEach(row => {
      const fecha = `${row.Año}-${row.IdMes.toString().padStart(2, '0')}`;
      if (!consumoPorFecha[fecha]) {
        consumoPorFecha[fecha] = [];
      }
      consumoPorFecha[fecha].push(row['Energía Facturada (MWh)']);
    });

    // Calcular promedio por fecha
    return Object.entries(consumoPorFecha)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, consumos]) => ({
        fecha,
        consumo: consumos.reduce((a, b) => a + b, 0) / consumos.length
      }));
  }, [datosFiltrados]);

  // 3. Consumo vs Temperatura (scatter plot)
  const datosConsumoTemperatura = useMemo(() => {
    if (!datosFiltrados.length) return null;

    return {
      temperaturas: datosFiltrados.map(d => d.temperatura),
      consumos: datosFiltrados.map(d => d['Energía Facturada (MWh)'])
    };
  }, [datosFiltrados]);

  // 4. Estacionalidad de Consumo
  const datosEstacionalidad = useMemo(() => {
    if (!datosFiltrados.length) return null;

    const consumoPorMes = datosFiltrados.reduce((acc, row) => {
      if (!acc[row.IdMes]) {
        acc[row.IdMes] = [];
      }
      acc[row.IdMes].push(row['Energía Facturada (MWh)']);
      return acc;
    }, {} as Record<number, number[]>);

    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    return Object.entries(consumoPorMes)
      .map(([mes, consumos]) => ({
        mes: parseInt(mes),
        nombreMes: meses[parseInt(mes) - 1],
        promedio: consumos.reduce((a, b) => a + b, 0) / consumos.length
      }))
      .sort((a, b) => a.mes - b.mes);
  }, [datosFiltrados]);

  // 5. Mapa de Coropletas
  const datosMapaCoropletas = useMemo(() => {
    if (!mapaData || !datosFiltrados.length) return null;

    // Calcular consumo promedio por empresa
    const consumoPorEmpresa = datosFiltrados.reduce((acc, row) => {
      if (!acc[row.IdEmpresa]) {
        acc[row.IdEmpresa] = [];
      }
      acc[row.IdEmpresa].push(row['Energía Facturada (MWh)']);
      return acc;
    }, {} as Record<number, number[]>);

    const promedios = Object.entries(consumoPorEmpresa).reduce((acc, [empresa, consumos]) => {
      acc[parseInt(empresa)] = consumos.reduce((a, b) => a + b, 0) / consumos.length;
      return acc;
    }, {} as Record<number, number>);

    // Preparar datos para el mapa
    const features = mapaData.features.map(feature => {
      const idEmpresa = feature.properties.IDSISDAT;
      const consumo = promedios[idEmpresa] || 0;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          consumo: consumo
        }
      };
    });

    // Calcular min y max para la escala de colores
    const consumos = Object.values(promedios);
    const minConsumo = Math.min(...consumos);
    const maxConsumo = Math.max(...consumos);

    return {
      features,
      minConsumo,
      maxConsumo
    };
  }, [mapaData, datosFiltrados]);

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

  return (
    <div className="space-y-6">
      {/* Banner con Título y Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Análisis del Dataset de Entrenamiento</h2>
            <p className="text-gray-600">Visualizaciones interactivas con filtros dinámicos</p>
          </div>
          
          {/* Controles de Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Empresa</label>
              <select
                value={empresaSeleccionada}
                onChange={(e) => setEmpresaSeleccionada(e.target.value === 'todas' ? 'todas' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todas">Todas las empresas</option>
                {empresasDisponibles.map(empresa => (
                  <option key={empresa} value={empresa}>
                    {obtenerNombreEmpresa(empresa)}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Año</label>
              <select
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(e.target.value === 'todos' ? 'todos' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los años</option>
                {añosDisponibles.map(año => (
                  <option key={año} value={año}>
                    {año}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores principales - Separados del banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Registros Filtrados"
          value={datosFiltrados.length.toLocaleString()}
          subtitle="Datos mostrados"
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.25h-15A1.75 1.75 0 012 17.5v-15C2 1.78 2.78 1 3.5 1h15c.72 0 1.3.58 1.3 1.3v15.2c0 .97-.78 1.75-1.75 1.75z"/></svg>}
          color="text-blue-600"
        />
        <MetricCard
          title="Empresas"
          value={empresaSeleccionada === 'todas' ? empresasDisponibles.length : 1}
          subtitle="En visualización"
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>}
          color="text-green-600"
        />
        <MetricCard
          title="Período"
          value={añoSeleccionado === 'todos' ? `${Math.min(...añosDisponibles)}-${Math.max(...añosDisponibles)}` : añoSeleccionado.toString()}
          subtitle="Años analizados"
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.11-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>}
          color="text-purple-600"
        />
      </div>

      {/* Gráficos Principales */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 1. Consumo Promedio por Empresa */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumo Promedio por Empresa</h3>
          {datosConsumoEmpresa && (
            <Plot
              data={[
                {
                  x: datosConsumoEmpresa.slice(0, 15).map(d => d.promedio),
                  y: datosConsumoEmpresa.slice(0, 15).map(d => obtenerNombreEmpresa(d.empresa)),
                  type: 'bar',
                  orientation: 'h',
                  marker: { color: '#3B82F6' },
                  text: datosConsumoEmpresa.slice(0, 15).map(d => `${d.promedio.toFixed(0)} MWh`),
                  textposition: 'outside'
                }
              ]}
              layout={{
                xaxis: { title: 'Consumo Promedio (MWh)' },
                margin: { t: 20, r: 80, l: 150, b: 50 },
                height: 400
              }}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* 2. Evolución Temporal del Consumo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Evolución Temporal del Consumo</h3>
          {datosEvolucionTemporal && (
            <Plot
              data={[
                {
                  x: datosEvolucionTemporal.map(d => d.fecha),
                  y: datosEvolucionTemporal.map(d => d.consumo),
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#8B5CF6', width: 2 },
                  marker: { size: 6 },
                  name: 'Consumo Total'
                }
              ]}
              layout={{
                xaxis: { title: 'Fecha' },
                yaxis: { title: 'Consumo Total (MWh)' },
                margin: { t: 20, r: 20, l: 60, b: 50 },
                height: 400
              }}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 3. Consumo vs Temperatura */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumo vs Temperatura</h3>
          {datosConsumoTemperatura && (
            <Plot
              data={[
                {
                  x: datosConsumoTemperatura.temperaturas,
                  y: datosConsumoTemperatura.consumos,
                  type: 'scatter',
                  mode: 'markers',
                  marker: { 
                    color: '#F59E0B', 
                    size: 6,
                    opacity: 0.7
                  },
                  name: 'Datos'
                }
              ]}
              layout={{
                xaxis: { title: 'Temperatura (°C)' },
                yaxis: { title: 'Consumo (MWh)' },
                margin: { t: 20, r: 20, l: 60, b: 50 },
                height: 400
              }}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
            />
          )}
        </div>

        {/* 4. Estacionalidad de Consumo */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estacionalidad de Consumo</h3>
          {datosEstacionalidad && (
            <Plot
              data={[
                {
                  x: datosEstacionalidad.map(d => d.nombreMes),
                  y: datosEstacionalidad.map(d => d.promedio),
                  type: 'scatter',
                  mode: 'lines+markers',
                  line: { color: '#10B981', width: 3 },
                  marker: { size: 8, color: '#10B981' },
                  name: 'Consumo Promedio'
                }
              ]}
              layout={{
                xaxis: { title: 'Mes' },
                yaxis: { title: 'Consumo Promedio (MWh)' },
                margin: { t: 20, r: 20, l: 60, b: 50 },
                height: 400
              }}
              config={{ displayModeBar: false }}
              style={{ width: '100%' }}
            />
          )}
        </div>
      </div>

      {/* 5. Mapa de Coropletas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Energía Facturada (MWh) por Área</h3>
        {datosMapaCoropletas && (
          <Plot
            data={[
              {
                type: 'choroplethmap',
                locationmode: 'geojson-id',
                geojson: mapaData,
                locations: datosMapaCoropletas.features.map(f => f.properties.IDSISDAT),
                z: datosMapaCoropletas.features.map(f => f.properties.consumo),
                text: datosMapaCoropletas.features.map(f => 
                  `${f.properties.Arco_Nombr}<br>Consumo: ${f.properties.consumo.toFixed(0)} MWh`
                ),
                hovertemplate: '%{text}<extra></extra>',
                colorscale: [
                  [0, '#1E3A8A'],      // Azul oscuro
                  [0.25, '#3B82F6'],   // Azul
                  [0.5, '#60A5FA'],    // Azul claro
                  [0.75, '#FCA5A5'],   // Rosa claro
                  [1, '#DC2626']       // Rojo
                ],
                colorbar: {
                  title: 'MWh',
                  titleside: 'right'
                }
              }
            ]}
            layout={{
              geo: {
                fitbounds: 'locations',
                visible: false
              },
              margin: { t: 20, r: 20, l: 20, b: 20 },
              height: 500
            }}
            config={{ displayModeBar: false }}
            style={{ width: '100%' }}
          />
        )}
      </div>
    </div>
  );
};

export default AnalisisDataset;
