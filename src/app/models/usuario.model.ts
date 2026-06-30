/**
 * Modelo de Usuario.
 * Estructura mínima compartida por Storage y (eventualmente) SQLite.
 */
export interface Usuario {
  nombre: string;
  password: string;
}
