import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

import { AuthService } from '../../services/auth.service';

/**
 * Página de inicio de sesión. Los inputs usan [(ngModel)] y vienen con
 * un usuario por defecto para facilitar la prueba. Al iniciar sesión se
 * valida con AuthService; si es correcto navega a /home.
 */
@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  public nombre: string = 'admin';
  public password: string = '1234';
  public errorLogin: string | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly alertController: AlertController
  ) {}

  public async ingresar(): Promise<void> {
    this.errorLogin = null;
    if (!this.nombre || !this.password) {
      this.errorLogin = 'Debes completar ambos campos.';
      return;
    }
    const ok = await this.authService.login(this.nombre.trim(), this.password);
    if (ok) {
      await this.router.navigate(['/home']);
    } else {
      const alert = await this.alertController.create({
        header: 'No fue posible iniciar sesión',
        message: 'El usuario o la contraseña no son válidos.',
        buttons: ['Aceptar'],
      });
      await alert.present();
    }
  }
}
