import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform, ToastController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';

import { Usuario } from '../models/usuario.model';

/**
 * Servicio de base de datos SQLite, siguiendo el patrón visto en clase
 * (semana 4): se crea la BD en el arranque, se generan las tablas con
 * CREATE TABLE IF NOT EXISTS y se expone la información mediante
 * BehaviorSubject (programación reactiva con RxJS).
 *
 * IMPORTANTE: SQLite solo funciona en el entorno nativo (emulador /
 * dispositivo Android). En el navegador `sqlite.create()` falla (el
 * plugin Cordova no está disponible), por eso toda la inicialización
 * está envuelta para que la app NO se rompa en web; en web se trabaja
 * con Storage (ver StorageService) tal como mostró el profesor.
 */
@Injectable({ providedIn: 'root' })
export class DbTaskService {
  /** Conexión a la base de datos nativa. */
  private database!: SQLiteObject;

  // ============================================================
  //  SENTENCIAS SQL (tabla usuario)
  // ============================================================

  /** Tabla de usuarios. nombre como PRIMARY KEY, password de hasta 4. */
  tablaUsuarios: string =
    'CREATE TABLE IF NOT EXISTS usuario(nombre TEXT PRIMARY KEY, password VARCHAR(4) NOT NULL);';

  /** Registros por defecto, para que la app sea navegable de entrada. */
  registroUsuarios: string =
    "INSERT OR IGNORE INTO usuario(nombre, password) VALUES ('admin', '1234'), ('test', '1234');";

  // ============================================================
  //  OBSERVABLES (programación reactiva)
  // ============================================================

  /** Lista de usuarios cargada desde SQLite, reactiva para las páginas. */
  usuarios = new BehaviorSubject<Usuario[]>([]);

  /** Indica cuándo la base de datos ya está lista para consultarse. */
  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private sqlite: SQLite,
    private platform: Platform,
    private toastController: ToastController
  ) {
    this.crearBD();
  }

  /**
   * Espera a que la plataforma esté lista, crea/abre la base de datos
   * SQLite y dispara la creación de tablas. En web la creación falla y
   * se notifica sin romper la aplicación.
   */
  crearBD(): void {
    this.platform
      .ready()
      .then(() => {
        try {
          this.sqlite
            .create({ name: 'mascotas.db', location: 'default' })
            .then((db: SQLiteObject) => {
              this.database = db;
              this.crearTablas();
            })
            .catch((e) => {
              // En web el plugin Cordova no existe: se avisa por consola y
              // la app continúa con Storage. No se muestra toast en el
              // arranque para no ensuciar el primer render.
              console.warn('DbTaskService: SQLite no disponible (se usa Storage en web):', e);
            });
        } catch (e) {
          // Algunos entornos lanzan de forma síncrona si el plugin falta.
          console.warn('DbTaskService: SQLite no disponible (sync, se usa Storage):', e);
        }
      })
      .catch((e) => console.warn('DbTaskService: platform.ready() falló:', e));
  }

  /** Crea las tablas e inserta los datos por defecto. */
  async crearTablas(): Promise<void> {
    try {
      await this.database.executeSql(this.tablaUsuarios, []);
      await this.database.executeSql(this.registroUsuarios, []);
      console.log('DbTaskService: base de datos y tabla usuario creadas');
      await this.cargarUsuarios();
      this.isDbReady.next(true);
    } catch (e) {
      console.error('DbTaskService: error al crear las tablas:', e);
      this.presentarToast('Error al crear las tablas de la base de datos.');
    }
  }

  // ============================================================
  //  CONSULTAS (queries SQL)
  // ============================================================

  /** SELECT * FROM usuario → emite la lista por el BehaviorSubject. */
  async cargarUsuarios(): Promise<void> {
    const res = await this.database.executeSql('SELECT * FROM usuario', []);
    const items: Usuario[] = [];
    for (let i = 0; i < res.rows.length; i++) {
      items.push({
        nombre: res.rows.item(i).nombre,
        password: res.rows.item(i).password,
      });
    }
    this.usuarios.next(items);
  }

  /**
   * Valida credenciales contra la tabla usuario.
   * SELECT * FROM usuario WHERE nombre=? AND password=?
   */
  async validarUsuario(nombre: string, password: string): Promise<boolean> {
    const res = await this.database.executeSql(
      'SELECT * FROM usuario WHERE nombre = ? AND password = ?',
      [nombre, password]
    );
    return res.rows.length > 0;
  }

  /** True si la base de datos nativa ya quedó inicializada. */
  estaLista(): boolean {
    return this.isDbReady.value;
  }

  /** Toast utilitario para mensajes (como en el patrón del profe). */
  private async presentarToast(mensaje: string): Promise<void> {
    const toast = await this.toastController.create({ message: mensaje, duration: 3000 });
    await toast.present();
  }
}
