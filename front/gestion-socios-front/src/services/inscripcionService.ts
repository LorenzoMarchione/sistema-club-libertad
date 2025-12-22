import api from './api';

const INSCRIPCION_ENDPOINTS = {
  CREATE: '/inscripcion',
};

export interface CrearInscripcionPayload {
  personaId: number;
  deporteId: number;
  fechaInscripcion: string; // formato YYYY-MM-DD
}

const inscripcionService = {
  create(payload: CrearInscripcionPayload) {
    return api.post<string>(INSCRIPCION_ENDPOINTS.CREATE, payload).catch(error => {
      console.error('Error al crear inscripción:', error);
      throw error;
    });
  },
};

export default inscripcionService;
