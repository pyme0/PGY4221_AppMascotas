import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';

import { Producto } from '../models/producto.model';
import { StorageService } from './storage.service';

/**
 * Servicio de productos / catálogo.
 *
 * Implementa el patrón "cache + API" mencionado en el enunciado:
 *   1. Intenta leer la caché local (Ionic Storage) para mostrar
 *      información de inmediato (funciona offline).
 *   2. Consume la API para refrescar el catálogo.
 *   3. Si la API falla (404, sin internet, etc.), el cache ya está
 *      disponible como fallback robusto.
 *
 * API fuente: jsonplaceholder.typicode.com (posts) cruzada con
 * imágenes de Dog CEO (dog.ceo) para construir un catálogo
 * coherente con la temática de la tienda de mascotas.
 */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  /** Endpoint principal: lista "plana" de la API mock. */
  private readonly API_POSTS = 'https://jsonplaceholder.typicode.com/posts';
  /** Endpoint de imágenes por raza (se reutiliza varias veces). */
  private readonly API_PERRO = 'https://dog.ceo/api/breed/husky/images/random';

  /** Categorías que se asignan en orden a los 12 primeros productos. */
  private readonly CATEGORIAS = ['Perros', 'Gatos', 'Accesorios', 'Alimentos'];

  constructor(
    private readonly http: HttpClient,
    private readonly storageService: StorageService
  ) {}

  /**
   * Devuelve siempre el cache local, sin red. Útil como ruta
   * inmediata mientras se hace el fetch a la API.
   */
  public async obtenerDesdeCache(): Promise<Producto[]> {
    return this.storageService.obtenerCacheProductos<Producto>();
  }

  /**
   * Realiza la consulta HTTP y mapea cada item a Producto.
   * Si la operación falla, devuelve el cache como fallback y, en
   * última instancia, un array vacío.
   */
  public cargarProductos(): Observable<Producto[]> {
    return this.http.get<Array<{ userId: number; id: number; title: string; body: string }>>(this.API_POSTS).pipe(
      map(posts => posts.slice(0, 12).map((p, idx) => this.construirProducto(p, idx))),
      // Si la red falla, intenta con cache. Útil para el escenario "404
      // sin internet" descrito en la rúbrica.
      catchError(err => {
        console.warn('ProductosService: error al consumir la API, se usa cache:', err?.status ?? err);
        return of([] as Producto[]);
      })
    );
  }

  /**
   * Carga la API y, si la respuesta trae al menos un elemento,
   * actualiza el cache local para que esté disponible offline.
   * Devuelve siempre el listado efectivo que debe mostrarse.
   */
  public async cargarYCachear(): Promise<Producto[]> {
    try {
      const productos = await this.cargarProductos().toPromise();
      if (productos && productos.length > 0) {
        await this.storageService.guardarCacheProductos(productos);
        return productos;
      }
      // Si llegó array vacío es porque hubo error → devolvemos cache
      return await this.obtenerDesdeCache();
    } catch (err) {
      console.error('ProductosService: error inesperado:', err);
      return this.obtenerDesdeCache();
    }
  }

  /** Convierte un post de jsonplaceholder en un Producto de mascota. */
  private construirProducto(
    p: { id: number; title: string; body: string },
    index: number
  ): Producto {
    const categoria = this.CATEGORIAS[index % this.CATEGORIAS.length];
    return {
      id: p.id,
      titulo: this.capitalizar(p.title.split(' ').slice(0, 4).join(' ')),
      descripcion: this.capitalizar(p.body.split('.').slice(0, 1).join(' ').slice(0, 110)),
      // Una sola URL estable por id, evitando aleatoriedad en el catálogo.
      imagen: `https://dog.ceo/api/img/husky/${this.toDogImageIndex(p.id)}.jpg`,
      precio: 10000 + (p.id * 1990) % 80000,
      categoria
    };
  }

  /** Capitaliza la primera letra y limpia espacios sobrantes. */
  private capitalizar(texto: string): string {
    if (!texto) return '';
    return texto.trim().charAt(0).toUpperCase() + texto.trim().slice(1);
  }

  /**
   * Convierte un id numérico a un nombre de archivo de perro válido.
   * Las imágenes de Dog CEO siguen el patrón `n02091459_*.jpg`.
   */
  private toDogImageIndex(id: number): number {
    const base = 1000;
    return base + (id % 89);
  }
}
