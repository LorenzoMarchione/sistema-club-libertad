export interface Deporte {
  id?: number; // opcional porque no se envía al crear
  nombre: string;
  descripcion?: string;
  cuotaMensual: number; // Enviamos como número, aunque en backend es BigDecimal
  personasIds?: number[]; // IDs de las personas asociadas
  numeroSocios?: number; // Número de socios asociados
}