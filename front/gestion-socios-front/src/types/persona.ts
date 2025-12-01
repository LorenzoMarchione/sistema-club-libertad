export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string | null; // o Date si usas librerías como date-fns
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  categoria: 'SOCIO' | 'JUGADOR' | 'SOCIOYJUGADOR';
  fechaRegistro: string; // ISO 8601
  activo: boolean;
  socioResponsable: Persona | null;
}