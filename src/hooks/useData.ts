import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  DashboardData, 
  DatasetRow, 
  MetricasModelo, 
  ResultadoPrediccion, 
  MetricaEmpresa,
  DatosEntrenamientoPrueba,
  MapaData
  
} from '../types';

export const useData = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = <T>(text: string): T[] => {
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });
    
    if (parsed.errors.length > 0) {
      console.error('Errores al parsear CSV:', parsed.errors);
    }
    
    return parsed.data as T[];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos en paralelo
      const [
        datasetRes, 
        metricasRes, 
        resultadosRes, 
        metricasEmpresaRes,
        datosTrainTestRes,
        geojsonMapaRes,
      ] = await Promise.all([
        fetch('/data/df_dataset_unidos5.csv'),
        fetch('/data/metricas_modelo.json'),
        fetch('/data/resultado_modelo.csv'),
        fetch('/data/metrics_by_company.csv'),
        fetch('/data/data_train_test_20250601_175314.json'),
        fetch('/data/mapa.json'),
      ]);

      if (!datasetRes.ok || !metricasRes.ok || !resultadosRes.ok || !metricasEmpresaRes.ok || !datosTrainTestRes.ok) {
        throw new Error('Error al cargar los archivos de datos');
      }

      // Parsear archivos CSV
      const [datasetText, resultadosText, metricasEmpresaText] = await Promise.all([
        datasetRes.text(),
        resultadosRes.text(),
        metricasEmpresaRes.text()
      ]);

      // Parsear archivos JSON
      const [metricasJson, datosTrainTestJson, geojsonMapaJson] = await Promise.all([
        metricasRes.json(),
        datosTrainTestRes.json(),
        geojsonMapaRes.json()
      ]);

      const dataset = parseCSV<DatasetRow>(datasetText);
      const resultadosPrediccion = parseCSV<ResultadoPrediccion>(resultadosText);
      const metricasEmpresa = parseCSV<MetricaEmpresa>(metricasEmpresaText);

      console.log('Datos cargados exitosamente:', {
        dataset: dataset.length,
        resultadosPrediccion: resultadosPrediccion.length,
        metricasEmpresa: metricasEmpresa.length,
        metricas: !!metricasJson,
        datosTrainTest: Object.keys(datosTrainTestJson).length

      });

      setData({
        dataset,
        metricas: metricasJson as MetricasModelo,
        resultadosPrediccion,
        metricasEmpresa,
        datosEntrenamientoPrueba: datosTrainTestJson as DatosEntrenamientoPrueba,
        mapaData: geojsonMapaJson as MapaData,
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { data, loading, error, reload: loadData };
};
