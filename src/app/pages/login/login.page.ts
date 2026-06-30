import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

/**
 * Página de inicio de sesión.
 *
 * Replica exactamente el patrón visto en clases:
 *   - Inputs dos-way bindeados con [(ngModel)].
 *   - `ingresar()` consulta AuthService → si es correcto, navega a /home.
 *   - Si falla, muestra un AlertController con un mensaje breve.
 */
@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  /** Credencial del formulario. */
  public nombre: string = '';
  public password: string = '';

  /** Mensaje opcional (errores desde AuthService). */
  public errorLogin: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertController: AlertController
  ) {}

  /**
   * Ingreso usando Ionic Storage (funciona en web y en dispositivo).
   * Es el flujo recomendado para probar en el navegador.
   */
  public async ingresarConStorage(): Promise<void> {
    if (!this.camposValidos()) return;
    const ok = await this.authService.login(this.nombre.trim(), this.password);
    await this.resolverIngreso(ok);
  }

  /**
   * Ingreso usando SQLite. Solo funciona en dispositivo/emulador; en el
   * navegador avisa que use el ingreso con Storage (tal como mostró el
   * profesor con sus dos botones).
   */
  public async ingresarConSQLite(): Promise<void> {
    if (!this.camposValidos()) return;
    try {
      const ok = await this.authService.loginConSQLite(this.nombre.trim(), this.password);
      await this.resolverIngreso(ok);
    } catch (err) {
      if ((err as Error).message === 'SQLITE_NO_DISPONIBLE') {
        await this.mostrarAlerta(
          'SQLite no disponible en el navegador',
          'SQLite solo funciona en dispositivo o emulador Android. En el navegador, usa "Ingresar con Storage".'
        );
      } else {
        await this.mostrarAlerta('Error', 'Ocurrió un problema al consultar la base de datos.');
      }
    }
  }

  /** Valida que ambos campos estén completos. */
  private camposValidos(): boolean {
    this.errorLogin = null;
    if (!this.nombre || !this.password) {
      this.errorLogin = 'Debes completar ambos campos.';
      return false;
    }
    return true;
  }

  /** Navega al home si el login fue correcto, o muestra el error. */
  private async resolverIngreso(ok: boolean): Promise<void> {
    if (ok) {
      await this.router.navigate(['/home']);
    } else {
      await this.mostrarAlerta(
        'No fue posible iniciar sesión',
        'El usuario o la contraseña no son válidos.'
      );
    }
  }

  /** Helper para mostrar un AlertController simple. */
  private async mostrarAlerta(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }
}
