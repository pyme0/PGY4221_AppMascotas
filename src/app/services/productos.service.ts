import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Producto } from '../models/producto.model';
import { StorageService } from './storage.service';

/**
 * Servicio de catálogo (perros disponibles en Canem).
 *
 * Consume la API pública Dog CEO, que devuelve URLs de imágenes reales.
 * Cada URL trae la raza en la ruta (.../breeds/<raza>/...), que se usa
 * como nombre del producto. Implementa el patrón cache + API:
 *   1. Se muestra primero lo guardado en cache (funciona sin internet).
 *   2. Se consulta la API y se actualiza el cache.
 */
@Injectable({ providedIn: 'root' })
export class ProductosService {
  /** Cantidad de perros que se muestran en el catálogo. */
  private readonly CANTIDAD = 6;

  /** API pública de imágenes de perros. */
  private readonly API_PERROS = `https://dog.ceo/api/breeds/image/random/${this.CANTIDAD}`;

  constructor(
    private readonly http: HttpClient,
    private readonly storageService: StorageService
  ) {}

  /** Devuelve el catálogo guardado en cache (para mostrar sin internet). */
  public async obtenerDesdeCache(): Promise<Producto[]> {
    return this.storageService.obtenerCacheProductos<Producto>();
  }

  /**
   * Consume la API y arma el catálogo. Si la red falla, devuelve un
   * arreglo vacío y el cache se usa como respaldo.
   */
  public cargarProductos(): Observable<Producto[]> {
    return this.http.get<{ message: string[]; status: string }>(this.API_PERROS).pipe(
      map(respuesta => respuesta.message.map((url, i) => this.construirProducto(url, i))),
      catchError(err => {
        console.warn('ProductosService: error al consumir la API:', err?.status ?? err);
        return of([] as Producto[]);
      })
    );
  }

  /**
   * Carga desde la API y, si hay datos, los guarda en cache. Devuelve el
   * listado a mostrar (el cache si la API falla).
   */
  public async cargarYCachear(): Promise<Producto[]> {
    try {
      const productos = await firstValueFrom(this.cargarProductos());
      if (productos.length > 0) {
        await this.storageService.guardarCacheProductos(productos);
        return productos;
      }
      return await this.obtenerDesdeCache();
    } catch (err) {
      console.error('ProductosService: error inesperado:', err);
      return this.obtenerDesdeCache();
    }
  }

  /** Construye un Producto a partir de una URL de imagen de Dog CEO. */
  private construirProducto(url: string, indice: number): Producto {
    const raza = this.razaDesdeUrl(url);
    return {
      id: indice + 1,
      titulo: raza,
      descripcion: `Perro de raza ${raza}, disponible en Canem.`,
      imagen: url,
      precio: 90000 + indice * 25000,
      categoria: 'Perros',
    };
  }

  /** Extrae y formatea la raza desde la URL (.../breeds/<raza>/...). */
  private razaDesdeUrl(url: string): string {
    const parte = url.split('/breeds/')[1] || '';
    const slug = parte.split('/')[0] || 'perro';
    return slug
      .split('-')
      .reverse()
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ');
  }
}
