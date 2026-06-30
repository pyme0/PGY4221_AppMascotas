import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

import { StorageService } from './storage.service';
import { DbTaskService } from './db-task.service';

/**
 * Servicio de autenticación.
 *
 * Encapsula el estado de la sesión como un BehaviorSubject para que
 * sea reactivo, y expone los métodos `login` y `cerrarSesion` que
 * utilizan StorageService (capa de persistencia).
 *
 * Su rol en los Route Guards es proporcionar el `canActivate()`:
 *   - Devuelve true si hay sesión activa.
 *   - Devuelve false y redirige a /login si no la hay.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSubject = new BehaviorSubject<{ nombre: string } | null>(null);
  public readonly usuario$: Observable<{ nombre: string } | null> = this.usuarioSubject.asObservable();

  constructor(
    private readonly storageService: StorageService,
    private readonly dbTaskService: DbTaskService,
    private readonly router: Router
  ) {}

  /** En el arranque intenta levantar una sesión previamente guardada. */
  public async cargarSesionAlArrancar(): Promise<void> {
    const sesion = await this.storageService.obtenerSesion();
    if (sesion) {
      this.usuarioSubject.next(sesion);
      console.log('AuthService: sesión restaurada para', sesion.nombre);
    }
  }

  /** Espera asíncrona al primer valor del observable de sesión. */
  public async esperarPrimerValor(): Promise<{ nombre: string } | null> {
    return firstValueFrom(this.usuario$);
  }

  /**
   * Valida las credenciales. En el dispositivo (SQLite disponible)
   * consulta la tabla `usuario` de SQLite; en el navegador usa Ionic
   * Storage. La sesión se guarda siempre en Storage.
   */
  public async login(nombre: string, password: string): Promise<boolean> {
    let valido: boolean;
    if (this.dbTaskService.estaLista()) {
      valido = await this.dbTaskService.validarUsuario(nombre, password);
    } else {
      const usuarios = await this.storageService.obtenerUsuarios();
      valido = usuarios.some(u => u.nombre === nombre && u.password === password);
    }
    if (valido) {
      await this.storageService.iniciarSesion(nombre);
      this.usuarioSubject.next({ nombre });
      console.log('AuthService: login correcto para', nombre);
      return true;
    }
    console.warn('AuthService: intento de login fallido para', nombre);
    return false;
  }

  /** Persiste el logout y limpia el estado observable. */
  public async cerrarSesion(): Promise<void> {
    await this.storageService.cerrarSesion();
    this.usuarioSubject.next(null);
    console.log('AuthService: sesión cerrada');
    await this.router.navigate(['/login']);
  }

  /** Snapshot síncrono de la sesión, útil para guards. */
  public get sesionActual(): { nombre: string } | null {
    return this.usuarioSubject.value;
  }
}
