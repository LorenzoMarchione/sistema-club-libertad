import api from './api';

import { Usuario } from '../types/usuario';

const usuarioService = {
  getAll() {
    return api.get<Usuario[]>('/usuarios');
  },
  toggleEstado(id: number) {
    return api.patch(`/usuario/estado/${id}`);
  },
};

export default usuarioService;