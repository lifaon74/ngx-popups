import {
  Component, ElementRef, AfterViewInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { NgxDOMComponentContainer, NgxDOMComponent, NgxDOMComponentService } from 'ngx-dom-component';

import { NgxPopupComponent } from './popup.component';
import { IPopupConfig, NgxPopupService } from '../services/ngx-popup.service';

// <ngx-popup
// *ngFor="let popupId of popupIds;"
// (popupReady)="onPopupReady($event)"
// (popupClosed)="onPopupClosed($event)"
//   [popupId]="popupId"
//   ></ngx-popup>

@Component({
  selector: 'ngx-popups',
  template: `
   <ng-template #popupsContainer></ng-template>
  `
})
export class NgxPopupsManagerComponent implements AfterViewInit {

  @ViewChild('popupsContainer', { read: ViewContainerRef })
  public popupsContainer: ViewContainerRef;

  private _popups: NgxDOMComponent[];
  private _element: HTMLElement;
  private _ngxDOMComponentContainer: NgxDOMComponentContainer;

  constructor(private popupService: NgxPopupService,
              private ngxDOMComponentService: NgxDOMComponentService,
              element: ElementRef) {
    this._popups = [];
    this._element = element.nativeElement;
    if (!this._element.id) {
      this._element.id = 'popups-manager-' + Math.floor(Math.random() * 1e10).toString();
    }
    this.popupService.registerManager(this._element.id, this);
    this.checkVisibility();
  }

  ngAfterViewInit() {
    this._ngxDOMComponentContainer = this.ngxDOMComponentService.createContainer(this.popupsContainer);
  }

  open(config?: IPopupConfig, waitTransitionEnd?: boolean, detail?: any): Promise<NgxPopupComponent> {
    return new Promise((resolve: any) => {
      const ngxDOMComponent: NgxDOMComponent = this._ngxDOMComponentContainer.create({
        componentType: NgxPopupComponent
      });
      this._popups.push(ngxDOMComponent);
      this.checkVisibility();

      const popup: NgxPopupComponent = ngxDOMComponent.instance;
      popup.addEventListener('ready', () => {
        resolve(
          popup.open(config, waitTransitionEnd, detail).then(() => {
            return popup;
          })
        );
      }, { once: true });

      popup.addEventListener('close', () => {
        let index: number = this._popups.indexOf(ngxDOMComponent);
        if(index >= 0) {
          this._popups[index].destroy();
          this._popups.splice(index, 1);
          this.checkVisibility();
        }
      }, { once: true });
    });
  }

  close(popup: NgxPopupComponent, waitTransitionEnd?: boolean, detail?: any): Promise<void> {
    return popup.close(waitTransitionEnd, detail);
  }

  closeAll(): Promise<void> {
    return Promise.all(
      this._popups.slice(0)  // clone to avoid removing popups before finishing
        .map((popup: NgxDOMComponent) => {
          return popup.instance.close();
        })
    ).then(() => void 0);
  }

  private checkVisibility() {
    this._element.classList.toggle('visible', this._popups.length > 0);
  }

}
