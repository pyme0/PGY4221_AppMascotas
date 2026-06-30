import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { AuthService } from '../../services/auth.service';
import { StorageService } from '../../services/storage.service';

/**
 * Página "Mis datos" — implementa:
 *   - Segmentos en el home de la propia página (form + foto + cerrar sesión).
 *   - Plugin @capacitor/camera: la cámara abre, captura y se asigna
 *     al <img #preview>. La imagen se guarda en Storage para que
 *     esté disponible en próximos arranques.
 */
@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {
  public segmento: 'datos' | 'camara' = 'datos';

  /** Datos personales del formulario del segmento "Datos". */
  public telefono = '+56 9 ';
  public direccion = 'Av. Siempre Viva 742';
  public preferencias = 'Perros medianos';

  /** Mensaje de feedback tras tomar foto. */
  public mensajeFoto: string | null = null;

  /** Mensaje de feedback tras guardar el formulario de datos. */
  public mensajeGuardado: string | null = null;

  /** Foto actual (dataURL o URL). */
  public fotoPreview: string | null = null;

  constructor(
    private readonly storageService: StorageService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  public async ngOnInit(): Promise<void> {
    this.fotoPreview = await this.storageService.obtenerFotoPerfil();
    const datos = await this.storageService.obtenerDatosPerfil();
    if (datos) {
      this.telefono = datos.telefono;
      this.direccion = datos.direccion;
      this.preferencias = datos.preferencias;
    }
  }

  /** Cambia de segmento entre 'datos' y 'camara'. */
  public cambiarSegmento(s: 'datos' | 'camara'): void {
    this.segmento = s;
    this.mensajeFoto = null;
    this.mensajeGuardado = null;
  }

  /**
   * Valida y persiste los datos del formulario "Mis datos" en Storage.
   * Se valida que ningún campo quede vacío antes de guardar.
   */
  public async guardarDatos(): Promise<void> {
    this.mensajeGuardado = null;
    if (!this.telefono?.trim() || !this.direccion?.trim() || !this.preferencias?.trim()) {
      this.mensajeGuardado = 'Completa todos los campos antes de guardar.';
      return;
    }
    await this.storageService.guardarDatosPerfil({
      telefono: this.telefono.trim(),
      direccion: this.direccion.trim(),
      preferencias: this.preferencias.trim(),
    });
    this.mensajeGuardado = '¡Datos guardados correctamente!';
  }

  /**
   * Abre la cámara con @capacitor/camera.
   * En navegador (sin emulador) utiliza CameraSource.Prompt para
   * ofrecer la cámara real si está disponible o el diálogo de
   * selección de archivo como fallback.
   */
  public async tomarFoto(): Promise<void> {
    try {
      const imagen = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de perfil',
        promptLabelPhoto: 'Elegir foto',
        promptLabelPicture: 'Tomar foto'
      });
      if (imagen?.dataUrl) {
        this.fotoPreview = imagen.dataUrl;
        await this.storageService.guardarFotoPerfil(imagen.dataUrl);
        this.mensajeFoto = '¡Foto guardada con éxito!';
        console.log('PerfilPage: foto capturada y persistida');
      }
    } catch (err) {
      console.warn('PerfilPage: no se pudo abrir la cámara:', err);
      this.mensajeFoto = 'No se pudo tomar la foto. Inténtalo nuevamente.';
    }
  }

  public async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
  }

  public get nombreUsuario(): string {
    return this.authService.sesionActual?.nombre ?? '';
  }
}
