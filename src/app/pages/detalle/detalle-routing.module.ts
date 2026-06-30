import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetallePage } from './detalle.page';
import { AuthGuard } from '../../guards/auth.guard';

const routes: Routes = [
  {
    path: ':id',
    component: DetallePage,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DetallePageRoutingModule {}
