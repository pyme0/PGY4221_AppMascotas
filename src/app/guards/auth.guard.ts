import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación. Implementa la interfaz CanActivate tal
 * como se mostró en clases: si no hay sesión activa, devuelve un
 * UrlTree apuntando a /login.
 *
 * Se aplica a las rutas privadas (home, detalle, perfil).
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.authService.sesionActual) {
      return true;
    }
    console.warn('AuthGuard: acceso denegado, redirigiendo a /login');
    return this.router.createUrlTree(['/login']);
  }
}
