import api from './api';
import type { Deporte } from '../types/deporte';

// Definimos los endpoints como constantes (buenas prácticas)
const DEPORTE_ENDPOINTS = {
  GET_ALL: '/deportes',
  GET_BY_ID: (id: number) => `/deporte/${id}`,
  CREATE: '/deporte',
  UPDATE: (id: number) => `/deporte/${id}`,
  DELETE: (id: number) => `/deporte/${id}`,
};

const deporteService = {
  getAll() {
    return api.get<Deporte[]>(DEPORTE_ENDPOINTS.GET_ALL).catch(error => {
      console.error('Error al obtener deportes:', error);
      throw error;
    });
  },

  getById(id: number) {
    return api.get<Deporte>(DEPORTE_ENDPOINTS.GET_BY_ID(id)).catch(error => {
      console.error(`Error al obtener deporte con ID ${id}:`, error);
      throw error;
    });
  },

  create(deporte: Omit<Deporte, 'id'>) {
    return api.post<string>(DEPORTE_ENDPOINTS.CREATE, deporte).catch(error => {
      console.error('Error al crear deporte:', error);
      throw error;
    });
  },

  update(id: number, deporte: Partial<Deporte>) {
    return api.patch<string>(DEPORTE_ENDPOINTS.UPDATE(id), deporte).catch(error => {
      console.error(`Error al actualizar deporte con ID ${id}:`, error);
      throw error;
    });
  },

  delete(id: number) {
    return api.delete<string>(DEPORTE_ENDPOINTS.DELETE(id)).catch(error => {
      console.error(`Error al eliminar deporte con ID ${id}:`, error);
      throw error;
    });
  },
};

export default deporteService;