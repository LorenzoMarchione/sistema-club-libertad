import api from './api';
import type { Persona } from '../types/persona'; // opcional, si usas TypeScript con tipos
 // opcional, si usas TypeScript con tipos

// Definimos los endpoints como constantes (buenas prácticas)
const PERSONA_ENDPOINTS = {
  GET_ALL: '/personas',
  GET_BY_ID: (id: number) => `/persona/${id}`,
  CREATE: '/persona',
  UPDATE: (id: number) => `/persona/${id}`,
  TOGGLE_ACTIVE: (id: number) => `/persona/activo/${id}`,
};

// Servicio reutilizable
const personaService = {
  getAll() {
    return api.get<Persona[]>('/personas').catch(error => {
      console.error('Error en la API:', error);
      throw error; // Re-lanza para que el catch en el componente lo maneje
    });
  },

  getById(id: number) {
    return api.get<Persona>(PERSONA_ENDPOINTS.GET_BY_ID(id));
  },

  create(persona: Omit<Persona, 'id' | 'fechaRegistro'>) {
    // Transformar 'estado' de string a booleano antes de enviar
    const payload = {
      ...persona,
      estado: persona.estado === 'activo', // true si es 'activo', false si es 'inactivo'
    };

    return api.post<string>(PERSONA_ENDPOINTS.CREATE, payload);
  },

  update(id: number, persona: Partial<Persona>) {
    return api.patch<string>(PERSONA_ENDPOINTS.UPDATE(id), persona);
  },

  toggleActive(id: number) {
    return api.patch<string>(PERSONA_ENDPOINTS.TOGGLE_ACTIVE(id));
  },

  asociarDeporte(personaId: number, deporteId: number) {
    return api.post<string>(`/persona/${personaId}/deporte/${deporteId}`).catch(error => {
      console.error('Error al asociar deporte:', error);
      throw error;
    });
  },

  desasociarDeporte(personaId: number, deporteId: number) {
    return api.delete<string>(`/persona/${personaId}/deporte/${deporteId}`).catch(error => {
      console.error('Error al desasociar deporte:', error);
      throw error;
    });
  },

  getDeportes(personaId: number) {
    return api.get(`/persona/${personaId}/deportes`).catch(error => {
      console.error('Error al obtener deportes de la persona:', error);
      throw error;
    });
  },
};

export default personaService;