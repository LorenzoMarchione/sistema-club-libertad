import api from './api';

const PAGO_ENDPOINTS = {
  CREATE: '/pago',
};

export interface CrearPagoPayload {
  socioId: number;
  fechaPago: string; // YYYY-MM-DD
  montoTotal: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'DEBITO_AUTOMATICO';
  observaciones?: string;
  cuotaIds: number[];
}

const pagoService = {
  create(payload: CrearPagoPayload) {
    return api.post<string>(PAGO_ENDPOINTS.CREATE, payload).catch(error => {
      console.error('Error al crear pago:', error);
      throw error;
    });
  },
};

export default pagoService;
