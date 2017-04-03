import { NgModule } from '@angular/core';
import { NgxDOMComponentModule } from 'ngx-dom-component';

import { NgxPopupComponent } from './components/popup.component';
import { NgxPopupsManagerComponent } from './components/popupsManager.component';
import { NgxPopupService } from './services/ngx-popup.service';



@NgModule({
  imports: [NgxDOMComponentModule],
  declarations: [
    NgxPopupComponent, NgxPopupsManagerComponent
  ],
  providers: [
    NgxPopupService
  ],
  exports: [
    NgxPopupComponent, NgxPopupsManagerComponent
  ],
  entryComponents: [
    NgxPopupComponent
  ]
})
export class NgxPopupModule {}
