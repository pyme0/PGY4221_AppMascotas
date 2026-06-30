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
   * Valida contra el storage. Si las credenciales son correctas,
   * persiste la sesión y actualiza el BehaviorSubject.
   */
  public async login(nombre: string, password: string): Promise<boolean> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const encontrado = usuarios.find(u => u.nombre === nombre && u.password === password);
    if (encontrado) {
      await this.storageService.iniciarSesion(encontrado.nombre);
      this.usuarioSubject.next({ nombre: encontrado.nombre });
      console.log('AuthService: login correcto para', encontrado.nombre);
      return true;
    }
    console.warn('AuthService: intento de login fallido para', nombre);
    return false;
  }

  /**
   * Valida las credenciales contra la tabla `usuario` de SQLite. Solo
   * funciona en dispositivo/emulador; en web la BD no está lista y se
   * lanza el error 'SQLITE_NO_DISPONIBLE' para que la UI avise. La
   * sesión se persiste en Storage (igual que en el flujo del profesor).
   */
  public async loginConSQLite(nombre: string, password: string): Promise<boolean> {
    if (!this.dbTaskService.estaLista()) {
      throw new Error('SQLITE_NO_DISPONIBLE');
    }
    const ok = await this.dbTaskService.validarUsuario(nombre, password);
    if (ok) {
      await this.storageService.iniciarSesion(nombre);
      this.usuarioSubject.next({ nombre });
      console.log('AuthService: login con SQLite correcto para', nombre);
      return true;
    }
    console.warn('AuthService: login con SQLite fallido para', nombre);
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
