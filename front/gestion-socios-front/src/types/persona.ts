export interface Persona {
  id: string;
  apellido: string;
  nombre: string;
  dni: string;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  categoria: 'SOCIO' | 'JUGADOR' | 'SOCIOYJUGADOR';
  edad: number;
  fechaNacimiento: string; // ISO
  socioResponsable?: Persona; // "Nombre Apellido (DNI: XXXXXXXX)"
  deportes: string[]; // reservado para futuro
  estado: 'activo' | 'inactivo';
  fechaRegistro: string; // ISO
}