import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Producto } from '../../models/producto.model';
import { AuthService } from '../../services/auth.service';
import { ProductosService } from '../../services/productos.service';
import { StorageService } from '../../services/storage.service';

/**
 * Página principal: catálogo de productos / mascotas.
 *
 * El listado se compone en dos pasos:
 *   1. Carga inmediata desde el cache (LocalStorage).
 *   2. Petición a la API, persistencia de la respuesta.
 *
 * Si la API responde, el cache se actualiza y la vista se refresca.
 * Si la API falla, el cache inicial sigue disponible como fallback.
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  public productos: Producto[] = [];
  public cargando = true;
  public readonly categorias: string[] = ['Todos', 'Perros'];
  public categoriaSeleccionada: string = 'Todos';

  constructor(
    private readonly productosService: ProductosService,
    private readonly storageService: StorageService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  public async ngOnInit(): Promise<void> {
    // Primero mostramos lo guardado en cache (funciona sin internet).
    this.productos = await this.productosService.obtenerDesdeCache();
    if (this.productos.length > 0) {
      this.cargando = false;
    }

    // Luego consumimos la API con .subscribe y actualizamos el catálogo.
    this.productosService.cargarProductos().subscribe({
      next: async (lista) => {
        if (lista.length > 0) {
          this.productos = lista;
          await this.storageService.guardarCacheProductos(lista);
        }
        this.cargando = false;
        console.log('HomePage: productos en pantalla:', this.productos.length);
      },
      error: (err) => {
        console.error('HomePage: error al cargar productos:', err);
        this.cargando = false;
      },
    });
  }

  /** Navega al detalle del producto seleccionado. */
  public verDetalle(producto: Producto): void {
    this.router.navigate(['/detalle', producto.id]);
  }

  /** Getter reactivo para el total mostrado según la categoría activa. */
  public get productosFiltrados(): Producto[] {
    if (this.categoriaSeleccionada === 'Todos') return this.productos;
    return this.productos.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  /** Cambia la categoría y refresca el filtro. */
  public cambiarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
  }

  /** Formatea el precio a CLP sin decimales. */
  public formatearPrecio(n: number): string {
    return '$' + n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  /** Cierra la sesión desde el menú superior. */
  public async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
  }

  /**
   * Devuelve el nombre del usuario activo para personalizar el header.
   */
  public get nombreUsuario(): string {
    return this.authService.sesionActual?.nombre ?? 'Invitado';
  }
}
