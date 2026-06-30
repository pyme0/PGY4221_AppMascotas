# Canem

> Sumativa 2 — Experiencia de Aprendizaje 2
> **Asignatura:** Programación Aplicaciones Móviles (PGY4221)
> **Semana:** 6

Aplicación móvil híbrida construida con **Ionic + Angular** y empaquetada
para Android mediante **Capacitor**. Tema: catálogo de productos /
mascotas con login, persistencia local, consumo de API REST,
integración de plugin de cámara y navegación con guardas.

---

## 📋 Requisitos cubiertos por la rúbrica

| # | Criterio | Dónde se implementa |
|---|----------|---------------------|
| 1 | Experiencia de usuario, navegación, usabilidad | `app-routing.module.ts`, `pages/*` con `<ion-back-button>`, segmento y tabs |
| 2 | Manejo de estado y datos, Stores y persistencia | `services/storage.service.ts`, `services/db-task.service.ts` |
| 3 | Navegación + consultas asíncronas + persistencia | `services/productos.service.ts` (HttpClient + cache) |
| 4 | Performance de componentes del dispositivo | `LoadingController` / `ion-spinner`, `*ngFor` con `ion-virtual-scroll` opcional |
| 5 | Conexión con API, consultas síncronas | `services/productos.service.ts` (HttpClient) |
| 6 | Integración de plugins | `services/cámara` en `pages/perfil` (`@capacitor/camera`) |
| 7 | Chequeo del funcionamiento al permitir descarga y uso | `products.service.cargarYCachear()` con manejo de errores |
| 8 | Identifica memoria interna Stores y persistencia | `services/storage.service.ts` con `@ionic/storage` |
| 9 | Selecciona navegación y componentes | Páginas con `AuthGuard`, segmentos, refresher |
| 10 | Reconoce API para consultas síncronas y asíncronas con persistencia | Doble flujo: API → cache → fallback offline |

---

## 🏗 Arquitectura

```
src/app/
├── models/                  ← Interfaces TypeScript (Usuario, Producto)
├── services/                ← Servicios inyectables (Storage, DB-Task, Auth, Productos)
├── guards/                  ← CanActivate (AuthGuard)
├── pages/                   ← Lazy-loaded (login, home, detalle, perfil, not-found)
├── app.module.ts            ← Registra HttpClientModule, FormsModule, IonicStorageModule
├── app-routing.module.ts    ← Rutas con guards y wildcard → /not-found
└── app.component.ts
```

**Patrón central (como en clases):**
Todas las páginas consumen los servicios. La app implementa **los dos
mecanismos de persistencia** que pide la rúbrica:

- **Ionic Storage** (`storage.service.ts`): clave-valor, funciona en web
  y en dispositivo. Guarda sesión, cache de productos y foto de perfil.
- **SQLite** (`db-task.service.ts`): tabla `usuario` con `CREATE TABLE`,
  `INSERT` y `SELECT`. Solo corre en dispositivo/emulador Android (en el
  navegador el plugin Cordova no está disponible, por eso ahí se usa
  Storage). El login ofrece **dos botones** ("Ingresar con Storage" e
  "Ingresar con SQLite") para evidenciar ambos caminos.

---

## 🚀 Cómo ejecutar

### 1) Pruebas en navegador (rápido)

```bash
npm install
ionic serve              # o bien: npm start
```

Abre `http://localhost:8100/`.

### 2) Para compilar y desplegar en Android

```bash
npm install
ionic build              # genera www/
npx cap sync android     # copia www/ a android/app/src/main/assets/public
npx cap open android     # abre Android Studio
```

> Si `npx cap sync android` falla con error de capacitor.config,
> bórralo y reintenta (es un workaround conocido del profesor).

### 3) Generar APK firmado (producción)

En Android Studio:
- `Build > Generate Signed Bundle / APK`
- Seleccionar APK,填写 credenciales, generar release.

---

## 👤 Credenciales de prueba

| Usuario  | Contraseña |
|----------|-----------|
| `admin`  | `1234`     |
| `test`   | `1234`     |

Los usuarios se cargan automáticamente en el primer arranque
(ver `StorageService.cargarUsuariosDefecto()`).

---

## 🌐 API utilizada

- **Catálogo**: `https://jsonplaceholder.typicode.com/posts`
- **Imágenes de mascotas**: `https://dog.ceo/api/...`

El servicio `ProductosService` cruza ambas y mapea a la entidad
`Producto`. La primera vez guarda el resultado en **Ionic Storage**
para que la aplicación siga funcionando sin internet.

---

## 🧩 Plugins y persistencia nativa

- **`@capacitor/camera`**: Foto de perfil en la página "Mi Perfil".
- **`@capacitor/core`** + **`@capacitor/android`**: runtime y plataforma
  nativa (versiones alineadas 8.4.x).
- **`@awesome-cordova-plugins/sqlite`** + **`cordova-sqlite-storage`**:
  base de datos SQLite (tabla `usuario`). Capacitor puentea el plugin
  Cordova al sincronizar (`npx cap sync android` lo detecta).

### Cómo probar SQLite (solo en emulador/dispositivo)

```bash
npm install
ionic build
npx cap sync android      # detecta cordova-sqlite-storage
npx cap open android      # abrir Android Studio y correr en emulador
```

En el emulador, el botón **"Ingresar con SQLite"** valida contra la tabla
`usuario`. En el navegador ese botón avisa que use Storage (comportamiento
esperado: SQLite es nativo).

---

## 🔐 Estructura de rutas

| Path              | Página       | Guardia  |
|-------------------|--------------|----------|
| `/login`          | LoginPage    | —        |
| `/home`           | HomePage     | AuthGuard|
| `/detalle/:id`    | DetallePage  | AuthGuard|
| `/perfil`         | PerfilPage   | AuthGuard|
| `/not-found`      | NotFoundPage | —        |
| `/**` (cualquier otra) → redirige a `/not-found` | | |

---

## 📷 Datos de contexto (motivación)

El catálogo se trabajó en torno a **Canem** porque:

- Es un tema con el que la mayoría del curso trabajó continuidad
  desde la Sumativa 1 (Experiencia 1).
- Permite usar APIs abiertas reales (Dog CEO, jsonplaceholder).
- Da pie a todas las funcionalidades requeridas: login, catálogo,
  búsqueda por categoría, detalle, foto de mascota.

La problemática planteada: *"Muchos refugios y tiendas pequeñas no
tienen una plataforma para mostrar sus mascotas / productos en
dispositivos móviles. Esta app los ayuda a publicar un catálogo
rápido y mantenerlo actualizado sin conexión a internet."*

---

## 📁 Comandos de Ionic / Angular usados

```bash
ionic start PGY4221_AppMascotas blank --type=angular --capacitor
ionic generate page pages/login
ionic generate page pages/home
ionic generate page pages/detalle
ionic generate page pages/perfil
ionic generate page pages/not-found
ionic generate service services/storage
ionic generate service services/db-task
ionic generate service services/auth
ionic generate service services/productos
ionic generate guard guards/auth

# Persistencia nativa SQLite (semana 4)
npm install cordova-sqlite-storage
npm install @awesome-cordova-plugins/sqlite@5.44.0
npm install @awesome-cordova-plugins/core@5.44.0
npm install @capacitor/android
```

---

© 2026 — Duoc UC.
