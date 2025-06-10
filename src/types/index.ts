// Tipos para el dataset original
export interface DatasetRow {
  IdEmpresa: number;
  Año: number;
  IdMes: number;
  'Energía Facturada (MWh)': number;
  temperatura: number;
  precipitacion: number;
  PIB_mensual_interpolado: number;
  COSTO_CANASTA: number;
  INGRESO_FAMILIAR_MENSUAL: number;
}

// Tipos para métricas del modelo
export interface MetricasModelo {
  train: {
    mse: number;
    rmse: number;
    mae: number;
    r2: number;
  };
  test: {
    mse: number;
    rmse: number;
    mae: number;
    r2: number;
  };
}

// Tipos para resultados de predicción
export interface ResultadoPrediccion {
  fecha: string;
  año: number;
  mes: number;
  IdEmpresa: number;
  valor_real: number;
  prediccion: number;
  error: number;
  error_abs: number;
  error_porcentual: number;
}

// Tipos para métricas por empresa
export interface MetricaEmpresa {
  IdEmpresa: number;
  NombreEmpresa: string;
  N_Puntos: number;
  Consumo_Promedio: number;
  RMSE: number;
  MAE: number;
  R2: number;
  Error_Relativo_Porcentual: number;
}

// Tipos para datos de entrenamiento y prueba
export interface DatosEntrenamientoPrueba {
  X_train_original: {
    IdEmpresa: number[];
    Año: number[];
    IdMes: number[];
    temperatura: number[];
    precipitacion: number[];
    PIB_mensual_interpolado: number[];
    COSTO_CANASTA: number[];
    INGRESO_FAMILIAR_MENSUAL: number[];
    [key: string]: number[];
  };
  X_test_original: {
    IdEmpresa: number[];
    Año: number[];
    IdMes: number[];
    temperatura: number[];
    precipitacion: number[];
    PIB_mensual_interpolado: number[];
    COSTO_CANASTA: number[];
    INGRESO_FAMILIAR_MENSUAL: number[];
    [key: string]: number[];
  };
  y_train_original: number[];
  y_test_original: number[];
  y_pred_train: number[];
  y_pred_test: number[];
}

// Interfaz principal del dashboard
export interface DashboardData {
  dataset: DatasetRow[];
  metricas: MetricasModelo;
  resultadosPrediccion: ResultadoPrediccion[];
  metricasEmpresa: MetricaEmpresa[];
  datosEntrenamientoPrueba: DatosEntrenamientoPrueba;
  mapaData: MapaData;
}

// Tipo para la predicción nueva
export interface NuevaPrediccion {
  Año: number;
  IdMes: number;
  IdEmpresa: number;
  temperatura: number;
  precipitacion: number;
  PIB_mensual_interpolado: number;
  COSTO_CANASTA: number;
  INGRESO_FAMILIAR_MENSUAL: number;
}

// Tipo para el resultado de la predicción
export interface ResultadoNuevaPrediccion {
  prediccion: number;
  confianza?: number;
  mensaje?: string;
}

// Estadísticas del dataset
export interface EstadisticasDataset {
  totalRegistros: number;
  totalEmpresas: number;
  periodoInicio: string;
  periodoFin: string;
  promedioConsumo: number;
  medianaConsumo: number;
  stdConsumo: number;
  minConsumo: number;
  maxConsumo: number;
  rangoTemperatura: { min: number; max: number };
  rangoPrecipitacion: { min: number; max: number };
  rangoPIB: { min: number; max: number };
}

export interface MapaData {
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