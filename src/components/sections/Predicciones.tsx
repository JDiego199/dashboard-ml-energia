import React, { useState, useMemo } from 'react';
import { DashboardData, NuevaPrediccion, ResultadoNuevaPrediccion } from '../../types';

interface PrediccionesProps {
  data: DashboardData;
}

interface HistorialPrediccion extends NuevaPrediccion {
  id: string;
  timestamp: string;
  resultado: number;
}

const Predicciones: React.FC<PrediccionesProps> = ({ data }) => {
  const { dataset, metricasEmpresa } = data;
  
  // Estado del formulario
  const [formData, setFormData] = useState<NuevaPrediccion>({
    Año: 2024,
    IdMes: 1,
    IdEmpresa: 11,
    temperatura: 16.5,
    precipitacion: 150.0,
    PIB_mensual_interpolado: 20000000.0,
    COSTO_CANASTA: 520.0,
    INGRESO_FAMILIAR_MENSUAL: 450.0
  });

  // Estados de la aplicación
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultadoNuevaPrediccion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historial, setHistorial] = useState<HistorialPrediccion[]>([]);

  // Obtener empresas disponibles del dataset
  const empresasDisponibles = useMemo(() => {
    if (!dataset || dataset.length === 0) return [];
    
    const empresasUnicas = [...new Set(dataset.map(d => d.IdEmpresa))];
    return empresasUnicas.sort((a, b) => a - b);
  }, [dataset]);

  // Obtener valores promedio del dataset para sugerencias
  const valoresPromedio = useMemo(() => {
    if (!dataset || dataset.length === 0) return null;

    const temperaturas = dataset.map(d => d.temperatura);
    const precipitaciones = dataset.map(d => d.precipitacion);
    const pibs = dataset.map(d => d.PIB_mensual_interpolado);
    const costos = dataset.map(d => d.COSTO_CANASTA);
    const ingresos = dataset.map(d => d.INGRESO_FAMILIAR_MENSUAL);

    return {
      temperatura: temperaturas.reduce((a, b) => a + b, 0) / temperaturas.length,
      precipitacion: precipitaciones.reduce((a, b) => a + b, 0) / precipitaciones.length,
      PIB_mensual_interpolado: pibs.reduce((a, b) => a + b, 0) / pibs.length,
      COSTO_CANASTA: costos.reduce((a, b) => a + b, 0) / costos.length,
      INGRESO_FAMILIAR_MENSUAL: ingresos.reduce((a, b) => a + b, 0) / ingresos.length
    };
  }, [dataset]);

  // Nombres de los meses
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Validar formulario
  const validarFormulario = (): string | null => {
    if (formData.Año < 2009 || formData.Año > 2025) {
      return 'El año debe estar entre 2009 y 2025';
    }
    if (formData.IdMes < 1 || formData.IdMes > 12) {
      return 'El mes debe estar entre 1 y 12';
    }
    if (!empresasDisponibles.includes(formData.IdEmpresa)) {
      return 'Debe seleccionar una empresa válida';
    }
    if (formData.temperatura < -10 || formData.temperatura > 50) {
      return 'La temperatura debe estar entre -10°C y 50°C';
    }
    if (formData.precipitacion < 0 || formData.precipitacion > 1000) {
      return 'La precipitación debe estar entre 0 y 1000 mm';
    }
    if (formData.PIB_mensual_interpolado < 0) {
      return 'El PIB mensual debe ser positivo';
    }
    if (formData.COSTO_CANASTA < 0) {
      return 'El costo de la canasta debe ser positivo';
    }
    if (formData.INGRESO_FAMILIAR_MENSUAL < 0) {
      return 'El ingreso familiar debe ser positivo';
    }
    return null;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof NuevaPrediccion, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Realizar predicción
  const realizarPrediccion = async () => {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Llamada real al API de predicción
      const response = await fetch('http://127.0.0.1:5001/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      if (data.status !== 'success') {
        throw new Error('Error en la predicción: ' + (data.message || 'Desconocido'));
      }

      const resultado: ResultadoNuevaPrediccion = {
        prediccion: data.prediction,
        confianza: data.confidence,
        mensaje: 'Predicción realizada exitosamente',
        // intervalo_confianza: data.confidence_interval,
        // datos_historicos: data.historical_data,
        // analisis_sensibilidad: data.sensitivity_analysis
      };

      setResultado(resultado);

      // Agregar al historial
      const nuevaPrediccion: HistorialPrediccion = {
        ...formData,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('es-ES'),
        resultado: data.prediction
      };

      setHistorial(prev => [nuevaPrediccion, ...prev.slice(0, 9)]); // Mantener solo las últimas 10

    } catch (err: any) {
      setError('Error al realizar la predicción. ' + (err.message || 'Por favor, inténtelo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  // Obtener nombre de la empresa
  const obtenerNombreEmpresa = (idEmpresa: number): string => {
    const empresa = metricasEmpresa.find(e => e.IdEmpresa === idEmpresa);
    return empresa ? empresa.NombreEmpresa : `Empresa ${idEmpresa}`;
  };

  // Aplicar valores promedio
  const aplicarValoresPromedio = () => {
    if (valoresPromedio) {
      setFormData(prev => ({
        ...prev,
        temperatura: Math.round(valoresPromedio.temperatura * 10) / 10,
        precipitacion: Math.round(valoresPromedio.precipitacion * 10) / 10,
        PIB_mensual_interpolado: Math.round(valoresPromedio.PIB_mensual_interpolado),
        COSTO_CANASTA: Math.round(valoresPromedio.COSTO_CANASTA * 100) / 100,
        INGRESO_FAMILIAR_MENSUAL: Math.round(valoresPromedio.INGRESO_FAMILIAR_MENSUAL * 100) / 100
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Predicción de Consumo Energético</h2>
        <p className="text-gray-600">Realice predicciones de consumo energético utilizando el modelo entrenado</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Formulario de Predicción */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Parámetros de Predicción</h3>
            <button
              onClick={aplicarValoresPromedio}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Usar Valores Promedio
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Año */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                min="2009"
                max="2025"
                value={formData.Año}
                onChange={(e) => handleInputChange('Año', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Rango: 2009-2025</p>
            </div>

            {/* Mes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.IdMes}
                onChange={(e) => handleInputChange('IdMes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {meses.map((mes, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} - {mes}
                  </option>
                ))}
              </select>
            </div>

            {/* Empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                value={formData.IdEmpresa}
                onChange={(e) => handleInputChange('IdEmpresa', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {empresasDisponibles.map(empresa => (
                  <option key={empresa} value={empresa}>
                    {empresa} - {obtenerNombreEmpresa(empresa)}
                  </option>
                ))}
              </select>
            </div>

            {/* Temperatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temperatura (°C)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="-10"
                max="50"
                value={formData.temperatura}
                onChange={(e) => handleInputChange('temperatura', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Temperatura promedio del mes</p>
            </div>

            {/* Precipitación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precipitación (mm)
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1000"
                value={formData.precipitacion}
                onChange={(e) => handleInputChange('precipitacion', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Precipitación total del mes</p>
            </div>

            {/* PIB Mensual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PIB Mensual Interpolado
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                value={formData.PIB_mensual_interpolado}
                onChange={(e) => handleInputChange('PIB_mensual_interpolado', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">PIB mensual interpolado</p>
            </div>

            {/* Costo Canasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo Canasta
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.COSTO_CANASTA}
                onChange={(e) => handleInputChange('COSTO_CANASTA', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Costo de la canasta básica</p>
            </div>

            {/* Ingreso Familiar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingreso Familiar Mensual
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.INGRESO_FAMILIAR_MENSUAL}
                onChange={(e) => handleInputChange('INGRESO_FAMILIAR_MENSUAL', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Ingreso familiar promedio mensual</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Botón de Predicción */}
          <div className="mt-6">
            <button
              onClick={realizarPrediccion}
              disabled={loading}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Realizando Predicción...
                </div>
              ) : (
                'Realizar Predicción'
              )}
            </button>
          </div>
        </div>

        {/* Área de Resultados */}
        <div className="space-y-6">
          {/* Resultado Actual */}
          {resultado && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Resultado de la Predicción</h3>
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-6 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Consumo Predicho</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {resultado.prediccion.toFixed(1)} MWh
                  </p>
                  {resultado.confianza && (
                    <p className="text-sm text-gray-500 mt-2">
                      Confianza: {(resultado.confianza * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                {resultado.mensaje && (
                  <p className="text-sm text-green-600">{resultado.mensaje}</p>
                )}
              </div>
            </div>
          )}

          {/* Historial de Predicciones */}
          {historial.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Historial de Predicciones</h3>
              <div className="space-y-3">
                {historial.map((prediccion) => (
                  <div key={prediccion.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="text-sm">
                        <p className="font-medium">
                          {obtenerNombreEmpresa(prediccion.IdEmpresa)}
                        </p>
                        <p className="text-gray-500">
                          {meses[prediccion.IdMes - 1]} {prediccion.Año}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {prediccion.timestamp}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-blue-600">
                          {prediccion.resultado.toFixed(1)} MWh
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predicciones;
