export type EstadoCuota = 'GENERADA' | 'VENCIDA' | 'PAGADA';

export interface Cuota {
  id?: number;
  personaId?: {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
  };
  deporteId?: {
    id: number;
    nombre: string;
  };
  periodo: string;
  monto: number;
  estado: EstadoCuota;
  fechaVencimiento?: string;
  fechaGeneracion: string;
  concepto?: string;
  pagoId?: number;
}
