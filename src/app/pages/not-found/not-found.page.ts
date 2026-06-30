import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Página 404 — implementa el criterio "página no encontrada"
 * solicitado en la sumativa. Incluye un botón que devuelve al home.
 */
@Component({
  selector: 'app-not-found',
  templateUrl: 'not-found.page.html',
  styleUrls: ['not-found.page.scss'],
  standalone: false,
})
export class NotFoundPage {
  constructor(private readonly router: Router) {}

  public irAlInicio(): void {
    this.router.navigate(['/home']);
  }
}
