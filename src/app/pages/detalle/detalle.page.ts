import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Producto } from '../../models/producto.model';
import { ProductosService } from '../../services/productos.service';

/**
 * Vista de detalle: lee el parámetro :id de la URL y busca el
 * producto en el cache local. Si no se encuentra, intenta contra
 * la API. Es la página que el usuario ve al tocar una card del home.
 */
@Component({
  selector: 'app-detalle',
  templateUrl: 'detalle.page.html',
  styleUrls: ['detalle.page.scss'],
  standalone: false,
})
export class DetallePage implements OnInit {
  public producto: Producto | null = null;
  public cargando = true;
  public id: number = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productosService: ProductosService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.route.params.subscribe(params => {
      this.id = Number(params['id']);
      this.cargar();
    });
  }

  private async cargar(): Promise<void> {
    this.cargando = true;
    const cache = await this.productosService.obtenerDesdeCache();
    this.producto = cache.find(p => p.id === this.id) ?? null;

    // Si la cache no lo tiene (caso: navegación directa), intentamos
    // pedirlo a la API usando el id.
    if (!this.producto) {
      try {
        const desdeApi = await this.productosService.cargarYCachear();
        this.producto = desdeApi.find(p => p.id === this.id) ?? null;
      } catch (err) {
        console.error('DetallePage: no se pudo obtener el producto:', err);
      }
    }
    this.cargando = false;
  }

  public formatearPrecio(n: number): string {
    return '$' + n.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  public volver(): void {
    this.router.navigate(['/home']);
  }
}
