import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AuthService } from './services/auth.service';

/**
 * AppModule raíz.
 *
 * Registra los módulos requeridos para el flujo de la app:
 *   - HttpClientModule para el consumo de la API de productos.
 *   - FormsModule para el binding [(ngModel)] en los formularios.
 *   - IonicStorageModule.forRoot() para habilitar la persistencia
 *     local (Ionic Storage / LocalStorage) en todas las páginas.
 *
 * Adicionalmente, se usa APP_INITIALIZER para garantizar que
 * cualquier sesión previamente persistida sea restaurada ANTES de
 * que Angular Router intente evaluar los guards. Esto evita que un
 * usuario con sesión activa sea redirigido a /login al recargar.
 */
export function appInitializerFactory(authService: AuthService): () => Promise<void> {
  return () => authService.cargarSesionAlArrancar();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    IonicStorageModule.forRoot({
      name: '_mascotas_db',
      storeName: '_usuarios'
      // driverOrder omitido a propósito: usa el default de Ionic Storage,
      // que son los nombres REALES de driver de localforage 1.x
      // ('asyncStorage', 'localStorageWrapper'). Pasar ['indexeddb','localstorage']
      // hace que localforage rechace con "No available storage method found"
      // y el APP_INITIALIZER rompa el bootstrap de Angular (lView=null).
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    SQLite,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [AuthService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
