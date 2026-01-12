export type RolUsuario = 'ADMIN' | 'SECRETARIO';

export interface Usuario {
  id: number;
  username: string;
  role: RolUsuario;
  activo: boolean;
  ultimoAcceso?: string | null;
  intentosFallidos?: number;
  bloqueado?: boolean;
}