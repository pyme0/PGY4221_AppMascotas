import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';

import { Usuario } from '../models/usuario.model';

/**
 * Servicio centralizado de persistencia local (Ionic Storage).
 *
 * Diseñado como un único punto de acceso a los datos. Cualquier page
 * debe consumir este servicio, de modo que cambiar la implementación
 * (por ejemplo, migrar a SQLite) no requiera modificar las páginas.
 *
 * Estructura interna de claves:
 *   - 'usuarios'      -> Usuario[]
 *   - 'productos'     -> Producto[]  (cache tras primer consumo de API)
 *   - 'sesion_activa' -> { nombre: string; fechaLogin: string }
 *   - 'foto_perfil'   -> dataURL (string) de la última foto tomada
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  /** Indica si la instancia de Storage ya fue inicializada. */
  private inicializado = false;

  /** Lista de usuarios cargada en memoria, reactiva para los pages. */
  public readonly usuarios$ = new BehaviorSubject<Usuario[]>([]);

  constructor(private readonly storage: Storage) {
    this.inicializar();
  }

  /**
   * Crea la instancia del Storage y, en la primera ejecución,
   * carga los usuarios por defecto si el storage está vacío.
   */
  private async inicializar(): Promise<void> {
    if (this.inicializado) return;
    try {
      await this.storage.create();
      this.inicializado = true;
      console.log('StorageService: instancia inicializada');
      await this.cargarUsuariosDefecto();
      await this.refrescarListaUsuarios();
    } catch (err) {
      console.error('StorageService: error al inicializar:', err);
    }
  }

  /**
   * Si el storage no tiene usuarios cargados, inserta el usuario
   * por defecto para que la app sea navegable desde el primer arranque.
   */
  private async cargarUsuariosDefecto(): Promise<void> {
    const usuariosExistentes = (await this.storage.get('usuarios')) as Usuario[] | null;
    if (!usuariosExistentes || usuariosExistentes.length === 0) {
      const usuariosDefecto: Usuario[] = [
        { nombre: 'admin', password: '1234' },
        { nombre: 'test', password: '1234' }
      ];
      await this.storage.set('usuarios', usuariosDefecto);
      console.log('StorageService: usuarios por defecto cargados');
    }
  }

  /** Lee 'usuarios' del storage y lo emite por BehaviorSubject. */
  private async refrescarListaUsuarios(): Promise<void> {
    const lista = ((await this.storage.get('usuarios')) as Usuario[]) || [];
    this.usuarios$.next(lista);
    console.log('StorageService: lista de usuarios emitida con', lista.length, 'registros');
  }

  // ============================================================
  //  USUARIOS
  // ============================================================

  /** Devuelve la lista actual de usuarios (snapshot, sin suscribirse). */
  public async obtenerUsuarios(): Promise<Usuario[]> {
    return (((await this.storage.get('usuarios')) as Usuario[]) || []);
  }

  /** Agrega un nuevo usuario y refresca la lista reactiva. */
  public async agregarUsuario(usuario: Usuario): Promise<void> {
    const lista = await this.obtenerUsuarios();
    lista.push(usuario);
    await this.storage.set('usuarios', lista);
    await this.refrescarListaUsuarios();
  }

  // ============================================================
  //  SESIÓN
  // ============================================================

  /** Marca al usuario como sesión activa. */
  public async iniciarSesion(nombre: string): Promise<void> {
    const sesion = { nombre, fechaLogin: new Date().toISOString() };
    await this.storage.set('sesion_activa', sesion);
    console.log('StorageService: sesión iniciada para', nombre);
  }

  /** Obtiene la sesión activa o null si no existe. */
  public async obtenerSesion(): Promise<{ nombre: string; fechaLogin: string } | null> {
    return ((await this.storage.get('sesion_activa')) as any) || null;
  }

  /** Cierra la sesión activa. */
  public async cerrarSesion(): Promise<void> {
    await this.storage.remove('sesion_activa');
    console.log('StorageService: sesión cerrada');
  }

  // ============================================================
  //  PRODUCTOS (cache API)
  // ============================================================

  /** Persiste el cache de productos consumidos desde la API. */
  public async guardarCacheProductos(productos: unknown[]): Promise<void> {
    await this.storage.set('productos', productos);
    console.log('StorageService: cache de productos guardado (' + productos.length + ')');
  }

  /** Recupera el cache de productos o un array vacío si no existe. */
  public async obtenerCacheProductos<T>(): Promise<T[]> {
    return (((await this.storage.get('productos')) as T[]) || []);
  }

  // ============================================================
  //  FOTO DE PERFIL
  // ============================================================

  public async guardarFotoPerfil(dataUrl: string): Promise<void> {
    await this.storage.set('foto_perfil', dataUrl);
  }

  public async obtenerFotoPerfil(): Promise<string | null> {
    return ((await this.storage.get('foto_perfil')) as string) || null;
  }

  // ============================================================
  //  DATOS DE PERFIL (formulario "Mis datos")
  // ============================================================

  public async guardarDatosPerfil(datos: {
    telefono: string;
    direccion: string;
    preferencias: string;
  }): Promise<void> {
    await this.storage.set('datos_perfil', datos);
    console.log('StorageService: datos de perfil guardados');
  }

  public async obtenerDatosPerfil(): Promise<{
    telefono: string;
    direccion: string;
    preferencias: string;
  } | null> {
    return ((await this.storage.get('datos_perfil')) as any) || null;
  }
}
