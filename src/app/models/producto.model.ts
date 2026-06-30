/**
 * Modelo de Producto o Mascota en adopción / item de tienda.
 *
 * Se mantiene un shape único que pueda provenir tanto de la API
 * remota (jsonplaceholder + dog.ceo) como del cache local
 * (Ionic Storage) sin requerir transformaciones adicionales.
 */
export interface Producto {
  id: number;
  titulo: string;        // Nombre del producto / mascota
  descripcion: string;   // Descripción breve
  imagen: string;        // URL de la imagen (Dog CEO / jsonplaceholder)
  precio: number;        // Precio en CLP
  categoria: string;     // Perros | Gatos | Accesorios
}
