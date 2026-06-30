/**
 * Polyfills para Angular.
 *
 * Workaround: la versión ESM (fesm2015) de zone.js 0.15.x tiene un bug
 * conocido donde Webpack la envuelve como expresión de función sin
 * invocarla, por lo que los side-effects del final del archivo
 * (patchCommon + patchBrowser) nunca se ejecutan. Esto provoca que
 * Angular no aplique change detection y no renderice la app.
 *
 * Solución: usar `require('zone.js')` para forzar la condición
 * `require` del package.json exports, que apunta al bundle UMD
 * (./bundles/zone.umd.js) cuyo IIFE sí se auto-invoca.
 */

import './zone-flags';

declare const require: any;
require('zone.js');
